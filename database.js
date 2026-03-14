const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function query(text, params) {
    const client = await pool.connect();
    try {
        const res = await client.query(text, params);
        return res;
    } finally {
        client.release();
    }
}

async function ensureUser(discordId, username) {
    await query(
        `INSERT INTO users (discord_id, username, active_slot) VALUES ($1, $2, 1)
         ON CONFLICT (discord_id) DO UPDATE SET username = EXCLUDED.username`,
        [discordId, username]
    );
    await query(
        `INSERT INTO bank_accounts (discord_id) VALUES ($1)
         ON CONFLICT (discord_id) DO NOTHING`,
        [discordId]
    );
}

async function generateIban() {
    while (true) {
        const iban = String(Math.floor(1000000 + Math.random() * 9000000));
        const res = await query('SELECT 1 FROM identities WHERE iban = $1', [iban]);
        if (res.rows.length === 0) return iban;
    }
}

async function ensureIdentity(discordId, slot) {
    const existing = await query(
        'SELECT * FROM identities WHERE discord_id = $1 AND slot = $2',
        [discordId, slot]
    );
    if (existing.rows.length > 0) return existing.rows[0];
    const iban = await generateIban();
    const res = await query(
        `INSERT INTO identities (discord_id, slot, character_name, iban, balance)
         VALUES ($1, $2, NULL, $3, 0) RETURNING *`,
        [discordId, slot, iban]
    );
    return res.rows[0];
}

async function setActiveSlot(discordId, slot) {
    await query(
        'UPDATE users SET active_slot = $2 WHERE discord_id = $1',
        [discordId, slot]
    );
}

async function getActiveSlot(discordId) {
    const res = await query('SELECT active_slot FROM users WHERE discord_id = $1', [discordId]);
    return res.rows[0]?.active_slot ?? 1;
}

async function getActiveIdentity(discordId) {
    const slot = await getActiveSlot(discordId);
    return ensureIdentity(discordId, slot);
}

async function getIdentityByIban(iban) {
    const res = await query(
        `SELECT i.*, u.username FROM identities i
         JOIN users u ON u.discord_id = i.discord_id
         WHERE i.iban = $1`,
        [iban]
    );
    return res.rows[0] || null;
}

async function transferMoney(fromDiscordId, toIban, amount, note = null) {
    const sender = await getActiveIdentity(fromDiscordId);
    if (!sender) return { success: false, error: 'لم يتم العثور على هويتك النشطة.' };
    if (sender.frozen) return { success: false, error: '❄️ حسابك مجمّد. تواصل مع الإدارة.' };
    if (Number(sender.balance) < amount) return { success: false, error: `رصيدك غير كافٍ. رصيدك الحالي: \`${Number(sender.balance).toLocaleString()} ريال\`` };
    const receiver = await getIdentityByIban(toIban);
    if (!receiver) return { success: false, error: `لا يوجد حساب بالإيبان \`${toIban}\`` };
    if (receiver.frozen) return { success: false, error: '❄️ الحساب المستلم مجمّد. لا يمكن إتمام التحويل.' };
    if (receiver.discord_id === fromDiscordId && receiver.slot === sender.slot)
        return { success: false, error: 'لا يمكنك التحويل لنفس حسابك.' };
    await query('UPDATE identities SET balance = balance - $1 WHERE discord_id = $2 AND slot = $3',
        [amount, fromDiscordId, sender.slot]);
    await query('UPDATE identities SET balance = balance + $1 WHERE iban = $2', [amount, toIban]);
    await query(`INSERT INTO transactions (from_iban, to_iban, amount, type, note) VALUES ($1,$2,$3,'transfer',$4)`,
        [sender.iban, toIban, amount, note]);
    return { success: true, sender, receiver, amount };
}

async function depositCash(discordId, amount) {
    const sender = await getActiveIdentity(discordId);
    if (!sender) return { success: false, error: 'لم يتم العثور على هويتك النشطة.' };
    if (sender.frozen) return { success: false, error: '❄️ حسابك مجمّد. تواصل مع الإدارة.' };
    if (Number(sender.cash) < amount) return { success: false, error: `كاشك غير كافٍ. لديك: \`${Number(sender.cash).toLocaleString()} ريال\`` };
    await query('UPDATE identities SET cash = cash - $1, balance = balance + $1 WHERE discord_id = $2 AND slot = $3',
        [amount, discordId, sender.slot]);
    await query(`INSERT INTO transactions (from_iban, to_iban, amount, type, note) VALUES ('CASH',$1,$2,'deposit','إيداع كاش')`,
        [sender.iban, amount]);
    return { success: true, sender, amount };
}

async function withdrawCash(discordId, amount) {
    const sender = await getActiveIdentity(discordId);
    if (!sender) return { success: false, error: 'لم يتم العثور على هويتك النشطة.' };
    if (sender.frozen) return { success: false, error: '❄️ حسابك مجمّد. تواصل مع الإدارة.' };
    if (Number(sender.balance) < amount) return { success: false, error: `رصيدك البنكي غير كافٍ. رصيدك: \`${Number(sender.balance).toLocaleString()} ريال\`` };
    await query('UPDATE identities SET balance = balance - $1, cash = cash + $1 WHERE discord_id = $2 AND slot = $3',
        [amount, discordId, sender.slot]);
    await query(`INSERT INTO transactions (from_iban, to_iban, amount, type, note) VALUES ($1,'CASH',$2,'withdraw','صرف كاش')`,
        [sender.iban, amount]);
    return { success: true, sender, amount };
}

async function getTransactions(iban, limit = 15) {
    const res = await query(
        `SELECT * FROM transactions WHERE from_iban = $1 OR to_iban = $1 ORDER BY created_at DESC LIMIT $2`,
        [iban, limit]
    );
    return res.rows;
}

async function adminAddMoney(iban, amount, note = null) {
    const char = await getIdentityByIban(iban);
    if (!char) return { success: false, error: `لا يوجد حساب بالإيبان \`${iban}\`` };
    const res = await query(
        'UPDATE identities SET balance = balance + $1 WHERE iban = $2 RETURNING *',
        [amount, iban]
    );
    await query(`INSERT INTO transactions (from_iban, to_iban, amount, type, note) VALUES ('ADMIN',$1,$2,'deposit',$3)`,
        [iban, amount, note]);
    return { success: true, char, newBalance: res.rows[0].balance };
}

async function adminRemoveMoney(iban, amount, note = null) {
    const char = await getIdentityByIban(iban);
    if (!char) return { success: false, error: `لا يوجد حساب بالإيبان \`${iban}\`` };
    if (Number(char.balance) < amount) return { success: false, error: `الرصيد غير كافٍ. الرصيد الحالي: \`${Number(char.balance).toLocaleString()} ريال\`` };
    const res = await query(
        'UPDATE identities SET balance = balance - $1 WHERE iban = $2 RETURNING *',
        [amount, iban]
    );
    await query(`INSERT INTO transactions (from_iban, to_iban, amount, type, note) VALUES ($1,'ADMIN',$2,'withdraw',$3)`,
        [iban, amount, note]);
    return { success: true, char, newBalance: res.rows[0].balance };
}

async function freezeAccount(iban) {
    const res = await query('UPDATE identities SET frozen = TRUE WHERE iban = $1 RETURNING *', [iban]);
    return res.rows[0] || null;
}

async function unfreezeAccount(iban) {
    const res = await query('UPDATE identities SET frozen = FALSE WHERE iban = $1 RETURNING *', [iban]);
    return res.rows[0] || null;
}

async function getIdentitiesByDiscordId(discordId) {
    const res = await query('SELECT * FROM identities WHERE discord_id = $1 ORDER BY slot', [discordId]);
    return res.rows;
}

async function transferItem(fromDiscordId, toDiscordId, itemName) {
    const item = await query(
        'SELECT * FROM inventory WHERE discord_id = $1 AND LOWER(item_name) = LOWER($2)',
        [fromDiscordId, itemName]
    );
    if (!item.rows[0]) return { success: false, error: `لا يوجد في حقيبتك غرض باسم **${itemName}**` };
    const row = item.rows[0];
    if (row.quantity > 1) {
        await query(
            'UPDATE inventory SET quantity = quantity - 1 WHERE id = $1',
            [row.id]
        );
    } else {
        await query('DELETE FROM inventory WHERE id = $1', [row.id]);
    }
    const existing = await query(
        'SELECT * FROM inventory WHERE discord_id = $1 AND LOWER(item_name) = LOWER($2)',
        [toDiscordId, itemName]
    );
    if (existing.rows[0]) {
        await query(
            'UPDATE inventory SET quantity = quantity + 1 WHERE discord_id = $1 AND LOWER(item_name) = LOWER($2)',
            [toDiscordId, itemName]
        );
    } else {
        await query(
            'INSERT INTO inventory (discord_id, item_name, quantity) VALUES ($1, $2, 1)',
            [toDiscordId, itemName]
        );
    }
    return { success: true };
}

async function getImage(systemKey) {
    const key = systemKey.trim().toLowerCase();
    const res = await query('SELECT image_url FROM system_images WHERE LOWER(system_key) = $1', [key]);
    const url = res.rows[0]?.image_url;
    if (!url) return null;
    if (/^https?:\/\//i.test(url) || url.startsWith('attachment://')) return url;
    return null;
}

async function setImage(systemKey, imageUrl) {
    const key = systemKey.trim().toLowerCase();
    await query(
        `INSERT INTO system_images (system_key, image_url, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (system_key) DO UPDATE SET image_url = EXCLUDED.image_url, updated_at = NOW()`,
        [key, imageUrl]
    );
}

async function getInventory(discordId) {
    const res = await query(
        'SELECT item_name, quantity FROM inventory WHERE discord_id = $1 ORDER BY added_at',
        [discordId]
    );
    return res.rows;
}

async function addItem(discordId, itemName, quantity = 1) {
    const existing = await query(
        'SELECT * FROM inventory WHERE discord_id = $1 AND LOWER(item_name) = LOWER($2)',
        [discordId, itemName]
    );
    if (existing.rows[0]) {
        await query(
            'UPDATE inventory SET quantity = quantity + $3 WHERE discord_id = $1 AND LOWER(item_name) = LOWER($2)',
            [discordId, itemName, quantity]
        );
    } else {
        await query(
            'INSERT INTO inventory (discord_id, item_name, quantity) VALUES ($1, $2, $3)',
            [discordId, itemName, quantity]
        );
    }
}

async function unlockSlot3(discordId) {
    await query('UPDATE users SET unlocked_slot3=TRUE WHERE discord_id=$1', [discordId]);
}

async function isSlot3Unlocked(discordId) {
    const res = await query('SELECT unlocked_slot3 FROM users WHERE discord_id=$1', [discordId]);
    return res.rows[0]?.unlocked_slot3 === true;
}

async function getConfig(key) {
    const res = await query('SELECT value FROM server_config WHERE key=$1', [key]);
    return res.rows[0]?.value || null;
}
async function setConfig(key, value) {
    await query(
        `INSERT INTO server_config (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, value]
    );
}

async function logoutAllUsers() {
    await query('UPDATE users SET is_logged_in=FALSE');
}

async function addCharacterLog(discordId, username, action, characterName, slot, details = null) {
    await query(
        `INSERT INTO character_log (discord_id, username, action, character_name, slot, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [discordId, username, action, characterName, slot, details]
    );
}

async function getCharacterLogs(limit = 15, discordId = null) {
    if (discordId) {
        const res = await query(
            'SELECT * FROM character_log WHERE discord_id=$1 ORDER BY created_at DESC LIMIT $2',
            [discordId, limit]
        );
        return res.rows;
    }
    const res = await query('SELECT * FROM character_log ORDER BY created_at DESC LIMIT $1', [limit]);
    return res.rows;
}

async function createPendingIdentity(data) {
    const res = await query(
        `INSERT INTO pending_identities (discord_id, username, slot, char_name, family_name, birth_place, birth_date, gender)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [data.discordId, data.username, data.slot, data.charName, data.familyName, data.birthPlace, data.birthDate, data.gender]
    );
    return res.rows[0];
}

async function getPendingIdentity(id) {
    const res = await query('SELECT * FROM pending_identities WHERE id=$1 AND status=$2', [id, 'pending']);
    return res.rows[0] || null;
}

async function updatePendingStatus(id, status) {
    await query('UPDATE pending_identities SET status=$2 WHERE id=$1', [id, status]);
}

async function getPendingIdentities(limit = 25) {
    const res = await query(
        `SELECT * FROM pending_identities WHERE status='pending' ORDER BY created_at ASC LIMIT $1`,
        [limit]
    );
    return res.rows;
}

async function createIdentityFull(discordId, slot, data) {
    const existing = await query('SELECT iban FROM identities WHERE discord_id=$1 AND slot=$2', [discordId, slot]);
    if (existing.rows[0]) {
        const iban = existing.rows[0].iban;
        await query(
            `UPDATE identities SET character_name=$3, family_name=$4, birth_place=$5, birth_date=$6, gender=$7
             WHERE discord_id=$1 AND slot=$2`,
            [discordId, slot, data.charName, data.familyName, data.birthPlace, data.birthDate, data.gender]
        );
        return (await query('SELECT * FROM identities WHERE discord_id=$1 AND slot=$2', [discordId, slot])).rows[0];
    }
    const iban = await generateIban();
    await query(
        `INSERT INTO identities (discord_id, slot, character_name, family_name, birth_place, birth_date, gender, iban, balance)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)`,
        [discordId, slot, data.charName, data.familyName, data.birthPlace, data.birthDate, data.gender, iban]
    );
    return (await query('SELECT * FROM identities WHERE discord_id=$1 AND slot=$2', [discordId, slot])).rows[0];
}

async function loginIdentity(discordId, slot) {
    await query('UPDATE users SET active_slot=$2, is_logged_in=TRUE WHERE discord_id=$1', [discordId, slot]);
}

async function logoutIdentity(discordId) {
    await query('UPDATE users SET is_logged_in=FALSE WHERE discord_id=$1', [discordId]);
}

async function getLoginStatus(discordId) {
    const res = await query('SELECT active_slot, is_logged_in FROM users WHERE discord_id=$1', [discordId]);
    return res.rows[0] || { active_slot: null, is_logged_in: false };
}

async function getUserIdentities(discordId) {
    const res = await query(
        'SELECT * FROM identities WHERE discord_id=$1 ORDER BY slot',
        [discordId]
    );
    return res.rows;
}

async function postTweet(discordId, username, content) {
    const res = await query(
        'INSERT INTO x_posts (discord_id, username, content) VALUES ($1, $2, $3) RETURNING *',
        [discordId, username, content]
    );
    return res.rows[0];
}

async function getXTimeline(limit = 10) {
    const res = await query(
        'SELECT * FROM x_posts ORDER BY created_at DESC LIMIT $1',
        [limit]
    );
    return res.rows;
}

async function likePost(postId) {
    await query('UPDATE x_posts SET likes = likes + 1 WHERE id = $1', [postId]);
}

async function deletePost(postId, discordId) {
    const res = await query(
        'DELETE FROM x_posts WHERE id = $1 AND discord_id = $2 RETURNING *',
        [postId, discordId]
    );
    return res.rows.length > 0;
}

async function sendMessage(senderId, receiverId, content) {
    await query(
        'INSERT INTO phone_messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)',
        [senderId, receiverId, content]
    );
}

async function getMessages(discordId, limit = 10) {
    const res = await query(
        `SELECT pm.*, 
            us.username AS sender_name, 
            ur.username AS receiver_name
         FROM phone_messages pm
         LEFT JOIN users us ON us.discord_id = pm.sender_id
         LEFT JOIN users ur ON ur.discord_id = pm.receiver_id
         WHERE pm.receiver_id = $1 OR pm.sender_id = $1
         ORDER BY pm.created_at DESC LIMIT $2`,
        [discordId, limit]
    );
    return res.rows;
}

async function markMessagesRead(discordId) {
    await query('UPDATE phone_messages SET read = TRUE WHERE receiver_id = $1', [discordId]);
}

async function getUnreadCount(discordId) {
    const res = await query(
        'SELECT COUNT(*) AS cnt FROM phone_messages WHERE receiver_id = $1 AND read = FALSE',
        [discordId]
    );
    return parseInt(res.rows[0]?.cnt ?? 0);
}

async function addContact(ownerId, contactId, nickname) {
    await query(
        `INSERT INTO phone_contacts (owner_id, contact_id, nickname)
         VALUES ($1, $2, $3)
         ON CONFLICT (owner_id, contact_id) DO UPDATE SET nickname = EXCLUDED.nickname`,
        [ownerId, contactId, nickname || null]
    );
}

async function getContacts(ownerId) {
    const res = await query(
        `SELECT pc.*, u.username FROM phone_contacts pc
         JOIN users u ON u.discord_id = pc.contact_id
         WHERE pc.owner_id = $1 ORDER BY pc.added_at`,
        [ownerId]
    );
    return res.rows;
}

async function getShowroom() {
    const res = await query(
        'SELECT id, car_name, car_type, price, color FROM showroom WHERE available = TRUE ORDER BY added_at DESC',
        []
    );
    return res.rows;
}

async function addShowroomCar(carName, carType, price, color, addedBy) {
    await query(
        'INSERT INTO showroom (car_name, car_type, price, color, added_by) VALUES ($1, $2, $3, $4, $5)',
        [carName, carType || null, price || 0, color || null, addedBy]
    );
}

async function removeShowroomCar(id) {
    const res = await query('DELETE FROM showroom WHERE id = $1 RETURNING *', [id]);
    return res.rows.length > 0;
}

async function getVehicles(discordId) {
    const res = await query(
        'SELECT car_name, plate, added_at FROM vehicles WHERE discord_id = $1 ORDER BY added_at',
        [discordId]
    );
    return res.rows;
}

async function addVehicle(discordId, carName, plate) {
    const existing = await query('SELECT 1 FROM vehicles WHERE plate = $1', [plate]);
    if (existing.rows.length > 0) return { success: false, error: `رقم اللوحة \`${plate}\` مسجل مسبقاً.` };
    await query(
        'INSERT INTO vehicles (discord_id, car_name, plate) VALUES ($1, $2, $3)',
        [discordId, carName, plate]
    );
    return { success: true };
}

async function removeVehicle(discordId, plate) {
    const res = await query(
        'DELETE FROM vehicles WHERE discord_id = $1 AND plate = $2 RETURNING *',
        [discordId, plate]
    );
    return res.rows.length > 0;
}

async function getTickets(discordId) {
    const res = await query(
        'SELECT id, ticket_type, subject, status, created_at FROM tickets WHERE discord_id = $1 ORDER BY created_at DESC',
        [discordId]
    );
    return res.rows;
}

async function createTicket(discordId, ticketType, subject) {
    const res = await query(
        'INSERT INTO tickets (discord_id, ticket_type, subject) VALUES ($1, $2, $3) RETURNING id',
        [discordId, ticketType, subject]
    );
    return res.rows[0].id;
}

module.exports = {
    query, ensureUser, generateIban,
    unlockSlot3, isSlot3Unlocked,
    getConfig, setConfig, logoutAllUsers, addCharacterLog, getCharacterLogs,
    createPendingIdentity, getPendingIdentity, getPendingIdentities, updatePendingStatus,
    createIdentityFull, loginIdentity, logoutIdentity, getLoginStatus, getUserIdentities,
    postTweet, getXTimeline, likePost, deletePost,
    sendMessage, getMessages, markMessagesRead, getUnreadCount, addContact, getContacts,
    getShowroom, addShowroomCar, removeShowroomCar,
    getVehicles, addVehicle, removeVehicle,
    ensureIdentity, setActiveSlot, getActiveSlot, getActiveIdentity, getIdentityByIban,
    transferMoney, transferItem, getTransactions, depositCash, withdrawCash,
    adminAddMoney, adminRemoveMoney, freezeAccount, unfreezeAccount, getIdentitiesByDiscordId,
    getImage, setImage,
    getInventory, addItem,
    getTickets, createTicket
};
