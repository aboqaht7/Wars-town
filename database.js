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

async function useItem(discordId, itemName) {
    const item = await query(
        'SELECT * FROM inventory WHERE discord_id = $1 AND LOWER(item_name) = LOWER($2)',
        [discordId, itemName]
    );
    if (!item.rows[0]) return { success: false, error: `لا يوجد في حقيبتك غرض باسم **${itemName}**` };
    const row = item.rows[0];
    if (row.quantity > 1) {
        await query('UPDATE inventory SET quantity = quantity - 1 WHERE id = $1', [row.id]);
    } else {
        await query('DELETE FROM inventory WHERE id = $1', [row.id]);
    }
    return { success: true, remainingQty: row.quantity - 1 };
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

async function createXAccount(discordId, xUsername) {
    const existing = await query('SELECT * FROM x_accounts WHERE discord_id = $1', [discordId]);
    if (existing.rows[0]) return { success: false, error: 'لديك حساب X بالفعل.' };
    const taken = await query('SELECT 1 FROM x_accounts WHERE LOWER(x_username) = LOWER($1)', [xUsername]);
    if (taken.rows[0]) return { success: false, error: `اسم الحساب **@${xUsername}** مأخوذ، اختر اسماً آخر.` };
    await query('INSERT INTO x_accounts (discord_id, x_username) VALUES ($1, $2)', [discordId, xUsername]);
    return { success: true, xUsername };
}

async function getXAccount(discordId) {
    const res = await query('SELECT * FROM x_accounts WHERE discord_id = $1', [discordId]);
    return res.rows[0] || null;
}

async function deleteXAccount(discordId) {
    await query('DELETE FROM x_posts WHERE discord_id = $1', [discordId]);
    await query('DELETE FROM x_accounts WHERE discord_id = $1', [discordId]);
}

async function postTweet(discordId, content) {
    const acc = await query('SELECT x_username FROM x_accounts WHERE discord_id = $1', [discordId]);
    const xUsername = acc.rows[0]?.x_username || null;
    const res = await query(
        'INSERT INTO x_posts (discord_id, username, x_username, content) VALUES ($1, $2, $3, $4) RETURNING *',
        [discordId, xUsername || discordId, xUsername, content]
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

async function initPropertiesTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS properties (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            price BIGINT NOT NULL,
            image_url TEXT
        )
    `);
}
initPropertiesTable().catch(console.error);

async function addProperty(name, price, imageUrl) {
    const res = await query(
        'INSERT INTO properties (name, price, image_url) VALUES ($1, $2, $3) RETURNING *',
        [name, price, imageUrl || null]
    );
    return res.rows[0];
}

async function getProperties() {
    const res = await query('SELECT * FROM properties ORDER BY id ASC');
    return res.rows;
}

async function getPropertyById(id) {
    const res = await query('SELECT * FROM properties WHERE id=$1', [id]);
    return res.rows[0] || null;
}

async function deleteProperty(id) {
    await query('DELETE FROM properties WHERE id=$1', [id]);
}

async function deleteAllProperties() {
    await query('DELETE FROM properties');
}

async function updatePropertyImage(id, imageUrl) {
    await query('UPDATE properties SET image_url=$1 WHERE id=$2', [imageUrl, id]);
}

async function deleteIdentity(discordId, slot) {
    await query('DELETE FROM identities WHERE discord_id=$1 AND slot=$2', [discordId, slot]);
    // if they were logged in with this slot, log them out
    await query(
        'UPDATE users SET is_logged_in=FALSE, active_slot=NULL WHERE discord_id=$1 AND active_slot=$2',
        [discordId, slot]
    );
    // remove pending identities for this slot
    await query('DELETE FROM pending_identities WHERE discord_id=$1 AND slot=$2', [discordId, slot]);
}

async function deleteAllIdentities() {
    await query('DELETE FROM identities');
    await query('UPDATE users SET is_logged_in=FALSE, active_slot=NULL');
    await query('DELETE FROM pending_identities');
}

async function addToCash(discordId, slot, amount) {
    await query(
        'UPDATE identities SET cash = cash + $1 WHERE discord_id = $2 AND slot = $3',
        [amount, discordId, slot]
    );
}

async function addRobbery(name, tools, minMoney, maxMoney) {
    const res = await query(
        'INSERT INTO robberies (name, tools, min_money, max_money) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, tools, minMoney, maxMoney]
    );
    return res.rows[0];
}

async function getRobberies() {
    const res = await query('SELECT * FROM robberies ORDER BY created_at ASC');
    return res.rows;
}

async function getRobberyById(id) {
    const res = await query('SELECT * FROM robberies WHERE id=$1', [id]);
    return res.rows[0] || null;
}

async function deleteRobbery(id) {
    await query('DELETE FROM robberies WHERE id=$1', [id]);
}

async function checkLoginAndIdentity(discordId) {
    const status = await getLoginStatus(discordId);
    if (!status.is_logged_in) return '❌ لازم تسجّل دخول أولاً. استخدم `/identity` لتسجيل الدخول.';
    const res = await query(
        'SELECT character_name FROM identities WHERE discord_id=$1 AND slot=$2',
        [discordId, status.active_slot]
    );
    if (!res.rows[0]?.character_name) return '❌ لازم تنشئ هوية أولاً. استخدم `/identity` لإنشاء شخصيتك.';
    return null;
}

async function createSnapAccount(discordId, snapUsername) {
    const existing = await query('SELECT 1 FROM snap_accounts WHERE discord_id = $1', [discordId]);
    if (existing.rows[0]) return { success: false, error: 'لديك حساب سناب بالفعل.' };
    const taken = await query('SELECT 1 FROM snap_accounts WHERE LOWER(snap_username) = LOWER($1)', [snapUsername]);
    if (taken.rows[0]) return { success: false, error: `اسم الحساب **${snapUsername}** مأخوذ.` };
    await query('INSERT INTO snap_accounts (discord_id, snap_username) VALUES ($1, $2)', [discordId, snapUsername]);
    return { success: true };
}

async function getSnapAccount(discordId) {
    const res = await query('SELECT * FROM snap_accounts WHERE discord_id = $1', [discordId]);
    return res.rows[0] || null;
}

async function getSnapAccountByUsername(snapUsername) {
    const res = await query('SELECT * FROM snap_accounts WHERE LOWER(snap_username) = LOWER($1)', [snapUsername]);
    return res.rows[0] || null;
}

async function addSnapFriend(userId, friendId) {
    const exists = await query(
        'SELECT * FROM snap_friends WHERE (user_a=$1 AND user_b=$2) OR (user_a=$2 AND user_b=$1)',
        [userId, friendId]
    );
    if (exists.rows[0]) return { success: false, error: 'طلب الصداقة موجود بالفعل أو أنتما أصدقاء.' };
    await query('INSERT INTO snap_friends (user_a, user_b, status) VALUES ($1, $2, $3)', [userId, friendId, 'pending']);
    return { success: true };
}

async function acceptSnapFriend(userId, requesterId) {
    const res = await query(
        'UPDATE snap_friends SET status=$1 WHERE user_a=$2 AND user_b=$3 AND status=$4 RETURNING *',
        ['accepted', requesterId, userId, 'pending']
    );
    return res.rows.length > 0;
}

async function getSnapFriends(userId) {
    const res = await query(
        `SELECT sf.*, 
            CASE WHEN sf.user_a=$1 THEN sa_b.snap_username ELSE sa_a.snap_username END AS friend_username,
            CASE WHEN sf.user_a=$1 THEN sf.user_b ELSE sf.user_a END AS friend_id,
            CASE WHEN sf.user_a=$1 THEN sf.last_snap_a ELSE sf.last_snap_b END AS my_last_snap,
            CASE WHEN sf.user_a=$1 THEN sf.last_snap_b ELSE sf.last_snap_a END AS their_last_snap
         FROM snap_friends sf
         LEFT JOIN snap_accounts sa_a ON sa_a.discord_id = sf.user_a
         LEFT JOIN snap_accounts sa_b ON sa_b.discord_id = sf.user_b
         WHERE (sf.user_a=$1 OR sf.user_b=$1) AND sf.status='accepted'
         ORDER BY sf.streak DESC`,
        [userId]
    );
    return res.rows;
}

async function getPendingSnapRequests(userId) {
    const res = await query(
        `SELECT sf.*, sa.snap_username AS requester_username, sa.discord_id AS requester_id
         FROM snap_friends sf
         JOIN snap_accounts sa ON sa.discord_id = sf.user_a
         WHERE sf.user_b=$1 AND sf.status='pending'`,
        [userId]
    );
    return res.rows;
}

async function sendSnap(senderId, receiverId, content) {
    await query(
        'INSERT INTO snap_messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)',
        [senderId, receiverId, content]
    );
    await query('UPDATE snap_accounts SET score = score + 1 WHERE discord_id = $1', [senderId]);
    // update last_snap and check streak
    const now = new Date();
    const friendship = await query(
        'SELECT * FROM snap_friends WHERE (user_a=$1 AND user_b=$2) OR (user_a=$2 AND user_b=$1)',
        [senderId, receiverId]
    );
    if (!friendship.rows[0]) return;
    const f = friendship.rows[0];
    const isA = f.user_a === senderId;
    const col = isA ? 'last_snap_a' : 'last_snap_b';
    const otherCol = isA ? 'last_snap_b' : 'last_snap_a';
    await query(`UPDATE snap_friends SET ${col}=$1 WHERE id=$2`, [now, f.id]);
    const otherLast = f[otherCol];
    const hoursDiff = otherLast ? (now - new Date(otherLast)) / 3600000 : Infinity;
    if (hoursDiff <= 48) {
        await query('UPDATE snap_friends SET streak = streak + 1, last_snap_a=NULL, last_snap_b=NULL WHERE id=$1', [f.id]);
    }
}

async function getSnapInbox(userId) {
    const res = await query(
        `SELECT sm.*, sa.snap_username AS sender_username
         FROM snap_messages sm
         JOIN snap_accounts sa ON sa.discord_id = sm.sender_id
         WHERE sm.receiver_id=$1
         ORDER BY sm.seen ASC, sm.created_at DESC
         LIMIT 20`,
        [userId]
    );
    return res.rows;
}

async function markSnapSeen(snapId, userId) {
    await query('UPDATE snap_messages SET seen=TRUE WHERE id=$1 AND receiver_id=$2', [snapId, userId]);
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
    addProperty, getProperties, getPropertyById, deleteProperty, deleteAllProperties, updatePropertyImage,
    deleteIdentity, deleteAllIdentities,
    addToCash,
    addRobbery, getRobberies, getRobberyById, deleteRobbery,
    checkLoginAndIdentity,
    createSnapAccount, getSnapAccount, getSnapAccountByUsername,
    addSnapFriend, acceptSnapFriend, getSnapFriends, getPendingSnapRequests,
    sendSnap, getSnapInbox, markSnapSeen,
    createXAccount, getXAccount, deleteXAccount,
    postTweet, getXTimeline, likePost, deletePost,
    sendMessage, getMessages, markMessagesRead, getUnreadCount, addContact, getContacts,
    getShowroom, addShowroomCar, removeShowroomCar,
    getVehicles, addVehicle, removeVehicle,
    ensureIdentity, setActiveSlot, getActiveSlot, getActiveIdentity, getIdentityByIban,
    transferMoney, transferItem, useItem, getTransactions, depositCash, withdrawCash,
    adminAddMoney, adminRemoveMoney, freezeAccount, unfreezeAccount, getIdentitiesByDiscordId,
    getImage, setImage,
    getInventory, addItem,
    getTickets, createTicket
};
