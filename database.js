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

async function updateIban(discordId, slot, newIban) {
    const taken = await query('SELECT 1 FROM identities WHERE iban=$1 AND NOT (discord_id=$2 AND slot=$3)', [newIban, discordId, slot]);
    if (taken.rows.length) return { success: false, error: 'هذا الإيبان مستخدم من قِبل حساب آخر.' };
    const res = await query(
        'UPDATE identities SET iban=$1 WHERE discord_id=$2 AND slot=$3 RETURNING *',
        [newIban, discordId, slot]
    );
    if (!res.rows.length) return { success: false, error: 'لم يتم العثور على الهوية المحددة.' };
    return { success: true, identity: res.rows[0] };
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

async function getAllActiveIdentities() {
    const res = await query(`
        SELECT i.discord_id, i.slot, i.character_name, i.family_name, i.iban, i.birth_place, i.birth_date, i.gender
        FROM identities i
        JOIN users u ON u.discord_id = i.discord_id
        WHERE i.slot = u.active_slot
        AND i.character_name IS NOT NULL
        ORDER BY i.character_name
    `);
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

// x_posts migrations for retweet/reply columns
(async () => {
    await query(`ALTER TABLE x_posts ADD COLUMN IF NOT EXISTS retweets  INTEGER DEFAULT 0`);
    await query(`ALTER TABLE x_posts ADD COLUMN IF NOT EXISTS replies   INTEGER DEFAULT 0`);
    await query(`ALTER TABLE x_posts ADD COLUMN IF NOT EXISTS type      TEXT DEFAULT 'tweet'`);
    await query(`ALTER TABLE x_posts ADD COLUMN IF NOT EXISTS reply_to_id INTEGER`);
    await query(`ALTER TABLE x_posts ADD COLUMN IF NOT EXISTS retweet_of_id INTEGER`);
    await query(`ALTER TABLE x_posts ADD COLUMN IF NOT EXISTS orig_username TEXT`);
})().catch(console.error);

async function likePost(postId) {
    const res = await query(
        'UPDATE x_posts SET likes = likes + 1 WHERE id = $1 RETURNING likes',
        [postId]
    );
    return res.rows[0]?.likes ?? 0;
}

async function getPostById(id) {
    const res = await query('SELECT * FROM x_posts WHERE id=$1', [id]);
    return res.rows[0] || null;
}

async function retweetPost(discordId, originalPostId) {
    const acc = await query('SELECT x_username FROM x_accounts WHERE discord_id=$1', [discordId]);
    const xUsername = acc.rows[0]?.x_username || null;
    const orig = await query('SELECT * FROM x_posts WHERE id=$1', [originalPostId]);
    if (!orig.rows[0]) return null;
    const o = orig.rows[0];
    const res = await query(
        `INSERT INTO x_posts (discord_id, username, x_username, content, type, retweet_of_id, orig_username)
         VALUES ($1,$2,$3,$4,'retweet',$5,$6) RETURNING *`,
        [discordId, xUsername || discordId, xUsername, o.content, originalPostId, o.x_username]
    );
    await query('UPDATE x_posts SET retweets = retweets + 1 WHERE id=$1', [originalPostId]);
    return res.rows[0];
}

async function replyPost(discordId, originalPostId, content) {
    const acc = await query('SELECT x_username FROM x_accounts WHERE discord_id=$1', [discordId]);
    const xUsername = acc.rows[0]?.x_username || null;
    const orig = await query('SELECT * FROM x_posts WHERE id=$1', [originalPostId]);
    if (!orig.rows[0]) return null;
    const res = await query(
        `INSERT INTO x_posts (discord_id, username, x_username, content, type, reply_to_id, orig_username)
         VALUES ($1,$2,$3,$4,'reply',$5,$6) RETURNING *`,
        [discordId, xUsername || discordId, xUsername, content, originalPostId, orig.rows[0].x_username]
    );
    await query('UPDATE x_posts SET replies = replies + 1 WHERE id=$1', [originalPostId]);
    return res.rows[0];
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

async function initAdminRanksTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS admin_ranks (
            discord_id VARCHAR PRIMARY KEY,
            username   VARCHAR,
            rank_name  TEXT NOT NULL,
            points     INT DEFAULT 0,
            assigned_by VARCHAR,
            assigned_at TIMESTAMP DEFAULT NOW()
        )
    `);
    await query(`
        CREATE TABLE IF NOT EXISTS rank_types (
            id       SERIAL PRIMARY KEY,
            name     TEXT NOT NULL UNIQUE,
            emoji    TEXT DEFAULT '⭐',
            position INT DEFAULT 99
        )
    `);
}
initAdminRanksTable().catch(console.error);

async function getRankTypes() {
    const res = await query('SELECT * FROM rank_types ORDER BY position ASC, id ASC');
    return res.rows;
}

async function addRankType(name, emoji, position) {
    const res = await query(
        `INSERT INTO rank_types (name, emoji, position) VALUES ($1,$2,$3)
         ON CONFLICT (name) DO UPDATE SET emoji=$2, position=$3 RETURNING *`,
        [name, emoji || '⭐', position ?? 99]
    );
    return res.rows[0];
}

async function deleteRankType(name) {
    const res = await query('DELETE FROM rank_types WHERE name=$1 RETURNING *', [name]);
    return res.rows[0] || null;
}

async function setAdminRank(discordId, username, rankName, assignedBy) {
    await query(
        `INSERT INTO admin_ranks (discord_id, username, rank_name, assigned_by, assigned_at)
         VALUES ($1,$2,$3,$4,NOW())
         ON CONFLICT (discord_id) DO UPDATE
         SET rank_name=$3, username=$2, assigned_by=$4, assigned_at=NOW()`,
        [discordId, username, rankName, assignedBy]
    );
}

async function getAdminRank(discordId) {
    const res = await query('SELECT * FROM admin_ranks WHERE discord_id=$1', [discordId]);
    return res.rows[0] || null;
}

async function removeAdminRank(discordId) {
    const res = await query('DELETE FROM admin_ranks WHERE discord_id=$1 RETURNING *', [discordId]);
    return res.rows[0] || null;
}

async function getAllAdminRanks() {
    const res = await query('SELECT * FROM admin_ranks ORDER BY assigned_at ASC');
    return res.rows;
}

async function updateAdminPoints(discordId, delta) {
    const res = await query(
        'UPDATE admin_ranks SET points = points + $1 WHERE discord_id=$2 RETURNING *',
        [delta, discordId]
    );
    return res.rows[0] || null;
}

async function initEquipmentTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS equipment_items (
            id          SERIAL PRIMARY KEY,
            name        TEXT NOT NULL,
            description TEXT,
            price       INTEGER NOT NULL,
            created_at  TIMESTAMP DEFAULT NOW()
        )
    `);
}
initEquipmentTable().catch(console.error);

async function addEquipmentItem(name, price, description) {
    const res = await query(
        'INSERT INTO equipment_items (name, price, description) VALUES ($1,$2,$3) RETURNING *',
        [name, price, description || null]
    );
    return res.rows[0];
}

async function getEquipmentItems() {
    const res = await query('SELECT * FROM equipment_items ORDER BY id ASC');
    return res.rows;
}

async function getEquipmentItemById(id) {
    const res = await query('SELECT * FROM equipment_items WHERE id=$1', [id]);
    return res.rows[0] || null;
}

async function deleteEquipmentItem(id) {
    await query('DELETE FROM equipment_items WHERE id=$1', [id]);
}

async function deleteAllEquipmentItems() {
    await query('DELETE FROM equipment_items');
}

async function updateEquipmentItem(id, fields) {
    const allowed = ['name', 'price', 'description'];
    const vals = [], sets = [];
    let i = 1;
    for (const key of allowed) {
        if (fields[key] !== undefined) { sets.push(`${key}=$${i++}`); vals.push(fields[key]); }
    }
    if (!sets.length) return null;
    vals.push(id);
    const res = await query(`UPDATE equipment_items SET ${sets.join(',')} WHERE id=$${i} RETURNING *`, vals);
    return res.rows[0] || null;
}

async function initMarketTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS market_items (
            id          SERIAL PRIMARY KEY,
            name        TEXT NOT NULL,
            description TEXT,
            price       INTEGER NOT NULL,
            created_at  TIMESTAMP DEFAULT NOW()
        )
    `);
}
initMarketTable().catch(console.error);

async function addMarketItem(name, price, description) {
    const res = await query(
        'INSERT INTO market_items (name, price, description) VALUES ($1,$2,$3) RETURNING *',
        [name, price, description || null]
    );
    return res.rows[0];
}

async function getMarketItems() {
    const res = await query('SELECT * FROM market_items ORDER BY id ASC');
    return res.rows;
}

async function getMarketItemById(id) {
    const res = await query('SELECT * FROM market_items WHERE id=$1', [id]);
    return res.rows[0] || null;
}

async function deleteMarketItem(id) {
    await query('DELETE FROM market_items WHERE id=$1', [id]);
}

async function deleteAllMarketItems() {
    await query('DELETE FROM market_items');
}

async function updateMarketItem(id, fields) {
    const allowed = ['name', 'price', 'description'];
    const vals = [];
    const sets = [];
    let i = 1;
    for (const key of allowed) {
        if (fields[key] !== undefined) { sets.push(`${key}=$${i++}`); vals.push(fields[key]); }
    }
    if (!sets.length) return null;
    vals.push(id);
    const res = await query(`UPDATE market_items SET ${sets.join(',')} WHERE id=$${i} RETURNING *`, vals);
    return res.rows[0] || null;
}

async function initBlackMarketTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS black_market (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            price BIGINT NOT NULL
        )
    `);
}
initBlackMarketTable().catch(console.error);

async function addBlackMarketItem(name, price) {
    const res = await query(
        'INSERT INTO black_market (name, price) VALUES ($1, $2) RETURNING *',
        [name, price]
    );
    return res.rows[0];
}

async function getBlackMarketItems() {
    const res = await query('SELECT * FROM black_market ORDER BY id ASC');
    return res.rows;
}

async function getBlackMarketItemById(id) {
    const res = await query('SELECT * FROM black_market WHERE id=$1', [id]);
    return res.rows[0] || null;
}

async function deleteBlackMarketItem(id) {
    await query('DELETE FROM black_market WHERE id=$1', [id]);
}

async function deleteAllBlackMarketItems() {
    await query('DELETE FROM black_market');
}

async function updateBlackMarketItem(id, { name, price }) {
    const fields = [];
    const vals   = [];
    let i = 1;
    if (name  !== undefined) { fields.push(`name=$${i++}`);  vals.push(name); }
    if (price !== undefined) { fields.push(`price=$${i++}`); vals.push(price); }
    if (!fields.length) return null;
    vals.push(id);
    const res = await query(`UPDATE black_market SET ${fields.join(', ')} WHERE id=$${i} RETURNING *`, vals);
    return res.rows[0] || null;
}

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

async function updateProperty(id, { name, price, imageUrl }) {
    const fields = [];
    const vals   = [];
    let i = 1;
    if (name      !== undefined) { fields.push(`name=$${i++}`);      vals.push(name); }
    if (price     !== undefined) { fields.push(`price=$${i++}`);     vals.push(price); }
    if (imageUrl  !== undefined) { fields.push(`image_url=$${i++}`); vals.push(imageUrl); }
    if (!fields.length) return null;
    vals.push(id);
    const res = await query(`UPDATE properties SET ${fields.join(', ')} WHERE id=$${i} RETURNING *`, vals);
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

async function getRobberyByName(name) {
    const res = await query('SELECT * FROM robberies WHERE LOWER(name)=LOWER($1)', [name]);
    return res.rows[0] || null;
}

async function getPropertyByName(name) {
    const res = await query('SELECT * FROM properties WHERE LOWER(name)=LOWER($1)', [name]);
    return res.rows[0] || null;
}

async function updateRobbery(id, { name, tools, minMoney, maxMoney }) {
    const fields = [];
    const vals   = [];
    let i = 1;
    if (name     !== undefined) { fields.push(`name=$${i++}`);      vals.push(name); }
    if (tools    !== undefined) { fields.push(`tools=$${i++}`);     vals.push(tools); }
    if (minMoney !== undefined) { fields.push(`min_money=$${i++}`); vals.push(minMoney); }
    if (maxMoney !== undefined) { fields.push(`max_money=$${i++}`); vals.push(maxMoney); }
    if (!fields.length) return null;
    vals.push(id);
    const res = await query(`UPDATE robberies SET ${fields.join(', ')} WHERE id=$${i} RETURNING *`, vals);
    return res.rows[0] || null;
}

async function deleteRobbery(id) {
    await query('DELETE FROM robberies WHERE id=$1', [id]);
}

async function checkLoginAndIdentity(discordId, { allowCuffed = false } = {}) {
    const status = await getLoginStatus(discordId);
    if (!status.is_logged_in) return 'ماسجلت دخولك؟سجل دخولك يالامير بعدين تعال';
    const res = await query(
        'SELECT character_name FROM identities WHERE discord_id=$1 AND slot=$2',
        [discordId, status.active_slot]
    );
    if (!res.rows[0]?.character_name) return 'ماسجلت دخولك؟سجل دخولك يالامير بعدين تعال';
    if (!allowCuffed) {
        const cuffed = await pool.query('SELECT 1 FROM cuffed_players WHERE discord_id=$1', [discordId]);
        if (cuffed.rows[0]) return '🔗 أنت مكبّل ولا تستطيع تنفيذ هذا الإجراء.';
    }
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

async function getSnapConversation(userId, friendId) {
    const res = await query(
        `SELECT sm.*,
            sa.snap_username AS sender_username,
            ra.snap_username AS receiver_username
         FROM snap_messages sm
         JOIN snap_accounts sa ON sa.discord_id = sm.sender_id
         JOIN snap_accounts ra ON ra.discord_id = sm.receiver_id
         WHERE (sm.sender_id=$1 AND sm.receiver_id=$2)
            OR (sm.sender_id=$2 AND sm.receiver_id=$1)
         ORDER BY sm.created_at DESC
         LIMIT 15`,
        [userId, friendId]
    );
    await query(
        'UPDATE snap_messages SET seen=TRUE WHERE sender_id=$2 AND receiver_id=$1 AND seen=FALSE',
        [userId, friendId]
    );
    return res.rows.reverse();
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

// ═══════════════════════════════════════════════════════
//  JOB SYSTEM — prices, cooldowns, actions
// ═══════════════════════════════════════════════════════
const JOB_ITEMS = {
    fishing:    ['سمك هامور', 'سالمون', 'روبيان', 'حوت'],
    woodcutting:['خشب'],
    mining:     ['الماس', 'ذهب', 'فضة', 'نحاس'],
};

const PRICE_RANGES = {
    'سمك هامور': [100,  500],
    'سالمون':    [80,   400],
    'روبيان':    [50,   250],
    'حوت':       [300,  1000],
    'خشب':       [30,   150],
    'الماس':     [500,  1000],
    'ذهب':       [200,  700],
    'فضة':       [100,  400],
    'نحاس':      [50,   200],
};

const DEFAULT_PRICES = {
    'سمك هامور': 250,  'سالمون': 180,  'روبيان': 100,  'حوت': 600,
    'خشب': 80,
    'الماس': 800, 'ذهب': 400, 'فضة': 200, 'نحاس': 100,
};

async function initJobTables() {
    await query(`
        CREATE TABLE IF NOT EXISTS job_prices (
            item_name  TEXT PRIMARY KEY,
            price      INTEGER NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `);
    await query(`
        CREATE TABLE IF NOT EXISTS job_cooldowns (
            discord_id TEXT NOT NULL,
            job_name   TEXT NOT NULL,
            last_used  TIMESTAMP DEFAULT NOW(),
            PRIMARY KEY (discord_id, job_name)
        )
    `);
    for (const [item, price] of Object.entries(DEFAULT_PRICES)) {
        await query(
            `INSERT INTO job_prices (item_name, price) VALUES ($1,$2) ON CONFLICT (item_name) DO NOTHING`,
            [item, price]
        );
    }
}
initJobTables().catch(console.error);

// ─── CASES SYSTEM ────────────────────────────────────────────────────────────

const CASE_STATUS = {
    pending:     '⏳ معلقة',
    accepted:    '✅ مقبولة',
    rejected:    '❌ مرفوضة',
    in_progress: '⚖️ جارية',
    closed:      '🔒 مغلقة',
};

async function initCasesTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS cases (
            id             SERIAL PRIMARY KEY,
            case_number    TEXT UNIQUE NOT NULL,
            plaintiff_id   TEXT NOT NULL,
            plaintiff_name TEXT NOT NULL,
            defendant      TEXT NOT NULL DEFAULT '',
            title          TEXT NOT NULL,
            description    TEXT NOT NULL,
            evidence       TEXT DEFAULT '',
            status         TEXT DEFAULT 'pending',
            lawyer_id      TEXT,
            lawyer_name    TEXT,
            judge_id       TEXT,
            judge_name     TEXT,
            verdict        TEXT,
            verdict_by     TEXT,
            reject_reason  TEXT,
            created_at     TIMESTAMP DEFAULT NOW(),
            updated_at     TIMESTAMP DEFAULT NOW()
        )
    `);
}
initCasesTable().catch(console.error);

async function createCase(plaintiffId, plaintiffName, defendant, title, description, evidence, lawyerFee = '') {
    const count  = await query('SELECT COUNT(*) FROM cases');
    const num    = String(Number(count.rows[0].count) + 1).padStart(4, '0');
    const caseNo = `CASE-${num}`;
    const res    = await query(
        `INSERT INTO cases (case_number, plaintiff_id, plaintiff_name, defendant, title, description, evidence, lawyer_fee)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [caseNo, plaintiffId, plaintiffName, defendant, title, description, evidence, lawyerFee]
    );
    return res.rows[0];
}

async function getCasesByPlaintiff(discordId) {
    const res = await query('SELECT * FROM cases WHERE plaintiff_id=$1 ORDER BY created_at DESC', [discordId]);
    return res.rows;
}

async function getCasesByStatus(status) {
    const res = await query('SELECT * FROM cases WHERE status=$1 ORDER BY created_at ASC', [status]);
    return res.rows;
}

async function getCasesByJudge(judgeId) {
    const res = await query(
        `SELECT * FROM cases WHERE judge_id=$1 AND status='in_progress' ORDER BY updated_at DESC`,
        [judgeId]
    );
    return res.rows;
}

async function getCaseById(id) {
    const res = await query('SELECT * FROM cases WHERE id=$1', [id]);
    return res.rows[0] || null;
}

async function acceptCase(id) {
    await query(`UPDATE cases SET status='accepted', updated_at=NOW() WHERE id=$1`, [id]);
}

async function rejectCase(id, reason, rejectedBy) {
    await query(`UPDATE cases SET status='rejected', reject_reason=$2, verdict_by=$3, updated_at=NOW() WHERE id=$1`,
        [id, reason, rejectedBy]);
}

async function assignJudge(id, judgeId, judgeName) {
    await query(`UPDATE cases SET status='in_progress', judge_id=$2, judge_name=$3, updated_at=NOW() WHERE id=$1`,
        [id, judgeId, judgeName]);
}

async function issueVerdict(id, verdict, verdictBy) {
    await query(`UPDATE cases SET status='closed', verdict=$2, verdict_by=$3, updated_at=NOW() WHERE id=$1`,
        [id, verdict, verdictBy]);
}

async function assignLawyer(id, lawyerId, lawyerName) {
    await query(
        `UPDATE cases SET lawyer_id=$2, lawyer_name=$3, lawyer_assigned_at=NOW(), updated_at=NOW() WHERE id=$1`,
        [id, lawyerId, lawyerName]
    );
}

async function getCasesByLawyer(lawyerId) {
    const res = await query(
        `SELECT * FROM cases WHERE lawyer_id=$1 ORDER BY updated_at DESC`,
        [lawyerId]
    );
    return res.rows;
}

async function chargeLawyerFee(plaintiffId, lawyerId, amount, note) {
    const plaintiff = await getActiveIdentity(plaintiffId);
    if (!plaintiff) return { success: false, error: 'الموكّل غير مسجل في البنك.' };
    if (Number(plaintiff.balance) < amount)
        return { success: false, error: `رصيد الموكّل غير كافٍ. رصيده: \`${Number(plaintiff.balance).toLocaleString()} ريال\`` };
    const lawyer = await getActiveIdentity(lawyerId);
    if (!lawyer) return { success: false, error: 'المحامي لا يملك شخصية نشطة.' };

    await query('UPDATE identities SET balance = balance - $1 WHERE discord_id=$2 AND slot=$3',
        [amount, plaintiffId, plaintiff.slot]);
    await query('UPDATE identities SET balance = balance + $1 WHERE iban=$2',
        [amount, lawyer.iban]);
    await query(`INSERT INTO transactions (from_iban, to_iban, amount, type, note) VALUES ($1,$2,$3,'transfer',$4)`,
        [plaintiff.iban, lawyer.iban, amount, note]);
    return { success: true };
}

// ─── LAWYER ABANDON CASE ──────────────────────────────────────────────────────
async function abandonCase(caseId, lawyerId, plaintiffId, refundAmount) {
    // 1. خصم المبلغ من المحامي وإعادته للموكّل
    const lawyer    = await getActiveIdentity(lawyerId);
    const plaintiff = await getActiveIdentity(plaintiffId);

    if (!lawyer)    return { success: false, error: 'المحامي لا يملك شخصية نشطة.' };
    if (!plaintiff) return { success: false, error: 'الموكّل لا يملك شخصية نشطة.' };
    if (Number(lawyer.balance) < refundAmount)
        return { success: false, error: `رصيد المحامي غير كافٍ للتعويض. رصيده: \`${Number(lawyer.balance).toLocaleString()} ريال\`` };

    await query('UPDATE identities SET balance = balance - $1 WHERE discord_id=$2 AND slot=$3',
        [refundAmount, lawyerId, lawyer.slot]);
    await query('UPDATE identities SET balance = balance + $1 WHERE discord_id=$2 AND slot=$3',
        [refundAmount, plaintiffId, plaintiff.slot]);
    await query(`INSERT INTO transactions (from_iban, to_iban, amount, type, note) VALUES ($1,$2,$3,'transfer',$4)`,
        [lawyer.iban, plaintiff.iban, refundAmount, 'تعويض تخلٍّ عن التوكيل']);

    // 2. إلغاء ارتباط المحامي بالقضية وإعادة الحالة لـ accepted
    await query(
        `UPDATE cases SET lawyer_id=NULL, lawyer_name=NULL, lawyer_assigned_at=NULL,
         status='accepted', updated_at=NOW() WHERE id=$1`,
        [caseId]
    );

    return { success: true };
}

// ─── LAWYER REQUESTS ──────────────────────────────────────────────────────────
async function initLawyerRequestsTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS lawyer_requests (
            id             SERIAL PRIMARY KEY,
            case_id        INTEGER NOT NULL,
            case_number    TEXT NOT NULL,
            case_title     TEXT NOT NULL,
            plaintiff_id   TEXT NOT NULL,
            plaintiff_name TEXT NOT NULL,
            lawyer_id      TEXT NOT NULL,
            status         TEXT DEFAULT 'pending',
            created_at     TIMESTAMP DEFAULT NOW()
        )
    `);
}
initLawyerRequestsTable().catch(console.error);

async function createLawyerRequest(caseId, caseNumber, caseTitle, plaintiffId, plaintiffName, lawyerId) {
    await query(`DELETE FROM lawyer_requests WHERE case_id=$1`, [caseId]);
    const res = await query(
        `INSERT INTO lawyer_requests (case_id, case_number, case_title, plaintiff_id, plaintiff_name, lawyer_id)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [caseId, caseNumber, caseTitle, plaintiffId, plaintiffName, lawyerId]
    );
    return res.rows[0];
}

async function getLawyerRequests(lawyerId) {
    const res = await query(
        `SELECT * FROM lawyer_requests WHERE lawyer_id=$1 AND status='pending' ORDER BY created_at DESC`,
        [lawyerId]
    );
    return res.rows;
}

async function getLawyerRequestById(id) {
    const res = await query(`SELECT * FROM lawyer_requests WHERE id=$1`, [id]);
    return res.rows[0] || null;
}

async function updateLawyerRequest(id, status) {
    await query(`UPDATE lawyer_requests SET status=$2 WHERE id=$1`, [id, status]);
}

// ─── JUDGES REGISTRY ──────────────────────────────────────────────────────────
async function initJudgesTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS judges (
            discord_id   TEXT PRIMARY KEY,
            judge_name   TEXT NOT NULL,
            added_at     TIMESTAMP DEFAULT NOW()
        )
    `);
}
initJudgesTable().catch(console.error);

async function getJudges() {
    const res = await query('SELECT * FROM judges ORDER BY judge_name ASC');
    return res.rows;
}
async function addJudge(discordId, judgeName) {
    await query(
        `INSERT INTO judges (discord_id, judge_name) VALUES ($1,$2)
         ON CONFLICT (discord_id) DO UPDATE SET judge_name=$2`,
        [discordId, judgeName]
    );
}
async function removeJudge(discordId) {
    const res = await query('DELETE FROM judges WHERE discord_id=$1 RETURNING *', [discordId]);
    return res.rows[0] || null;
}
async function getJudgeById(discordId) {
    const res = await query('SELECT * FROM judges WHERE discord_id=$1', [discordId]);
    return res.rows[0] || null;
}

// ─── LAWYERS REGISTRY ─────────────────────────────────────────────────────────
async function initLawyersTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS lawyers (
            discord_id   TEXT PRIMARY KEY,
            lawyer_name  TEXT NOT NULL,
            added_at     TIMESTAMP DEFAULT NOW()
        )
    `);
}
initLawyersTable().catch(console.error);

async function getLawyers() {
    const res = await query('SELECT * FROM lawyers ORDER BY lawyer_name ASC');
    return res.rows;
}
async function addLawyer(discordId, lawyerName) {
    await query(
        `INSERT INTO lawyers (discord_id, lawyer_name) VALUES ($1,$2)
         ON CONFLICT (discord_id) DO UPDATE SET lawyer_name=$2`,
        [discordId, lawyerName]
    );
}
async function removeLawyer(discordId) {
    const res = await query('DELETE FROM lawyers WHERE discord_id=$1 RETURNING *', [discordId]);
    return res.rows[0] || null;
}

async function getJobPrices() {
    const res = await query('SELECT item_name, price FROM job_prices ORDER BY item_name');
    const map = {};
    for (const r of res.rows) map[r.item_name] = Number(r.price);
    return map;
}

async function updateAllJobPrices() {
    for (const [item, [min, max]] of Object.entries(PRICE_RANGES)) {
        const price = Math.floor(Math.random() * (max - min + 1)) + min;
        await query('UPDATE job_prices SET price=$1, updated_at=NOW() WHERE item_name=$2', [price, item]);
    }
}

async function getJobCooldown(discordId, jobName) {
    const res = await query(
        'SELECT last_used FROM job_cooldowns WHERE discord_id=$1 AND job_name=$2',
        [discordId, jobName]
    );
    return res.rows[0]?.last_used || null;
}

async function setJobCooldown(discordId, jobName) {
    await query(
        `INSERT INTO job_cooldowns (discord_id, job_name, last_used) VALUES ($1,$2,NOW())
         ON CONFLICT (discord_id, job_name) DO UPDATE SET last_used=NOW()`,
        [discordId, jobName]
    );
}

async function hasItem(discordId, itemName, qty = 1) {
    const res = await query(
        `SELECT quantity FROM inventory WHERE discord_id=$1 AND LOWER(item_name) LIKE '%' || LOWER($2) || '%'`,
        [discordId, itemName]
    );
    return res.rows[0] ? Number(res.rows[0].quantity) >= qty : false;
}

async function removeItem(discordId, itemName, qty = 1) {
    const res = await query(
        `SELECT item_name, quantity FROM inventory WHERE discord_id=$1 AND LOWER(item_name) LIKE '%' || LOWER($2) || '%'`,
        [discordId, itemName]
    );
    if (!res.rows[0]) return;
    const exactName = res.rows[0].item_name;
    const current   = Number(res.rows[0].quantity);
    if (current <= qty) {
        await query('DELETE FROM inventory WHERE discord_id=$1 AND item_name=$2', [discordId, exactName]);
    } else {
        await query(
            'UPDATE inventory SET quantity=$1 WHERE discord_id=$2 AND item_name=$3',
            [current - qty, discordId, exactName]
        );
    }
}

async function sellJobItemsByCategory(discordId, category) {
    const catItems = JOB_ITEMS[category] || [];
    if (!catItems.length) return { totalValue: 0, sold: [] };
    const inv    = await query('SELECT item_name, quantity FROM inventory WHERE discord_id=$1', [discordId]);
    const prices = await getJobPrices();
    let totalValue = 0;
    const sold = [];
    for (const row of inv.rows) {
        const match = catItems.find(ji => ji.toLowerCase() === row.item_name.toLowerCase());
        if (!match) continue;
        const price = prices[match] || 0;
        const qty   = Number(row.quantity);
        const value = price * qty;
        totalValue += value;
        sold.push({ name: row.item_name, qty, price, value });
        await query('DELETE FROM inventory WHERE discord_id=$1 AND LOWER(item_name)=LOWER($2)', [discordId, row.item_name]);
    }
    return { totalValue, sold };
}

async function sellJobItems(discordId) {
    const allJobItems = [
        ...JOB_ITEMS.fishing, ...JOB_ITEMS.woodcutting, ...JOB_ITEMS.mining
    ];
    const inv = await query('SELECT item_name, quantity FROM inventory WHERE discord_id=$1', [discordId]);
    const prices = await getJobPrices();
    let totalValue = 0;
    const sold = [];
    for (const row of inv.rows) {
        const match = allJobItems.find(ji => ji.toLowerCase() === row.item_name.toLowerCase());
        if (!match) continue;
        const price = prices[match] || 0;
        const qty   = Number(row.quantity);
        const value = price * qty;
        totalValue += value;
        sold.push({ name: row.item_name, qty, price, value });
        await query('DELETE FROM inventory WHERE discord_id=$1 AND LOWER(item_name)=LOWER($2)', [discordId, row.item_name]);
    }
    return { totalValue, sold };
}

module.exports = {
    query, ensureUser, generateIban,
    unlockSlot3, isSlot3Unlocked,
    updateIban,
    getConfig, setConfig, logoutAllUsers, addCharacterLog, getCharacterLogs,
    createPendingIdentity, getPendingIdentity, getPendingIdentities, updatePendingStatus,
    createIdentityFull, loginIdentity, logoutIdentity, getLoginStatus, getUserIdentities,
    setAdminRank, getAdminRank, removeAdminRank, getAllAdminRanks, updateAdminPoints,
    getRankTypes, addRankType, deleteRankType,
    addEquipmentItem, getEquipmentItems, getEquipmentItemById, deleteEquipmentItem, deleteAllEquipmentItems, updateEquipmentItem,
    addMarketItem, getMarketItems, getMarketItemById, deleteMarketItem, deleteAllMarketItems, updateMarketItem,
    addBlackMarketItem, getBlackMarketItems, getBlackMarketItemById, deleteBlackMarketItem, deleteAllBlackMarketItems, updateBlackMarketItem,
    addProperty, getProperties, getPropertyById, getPropertyByName, updateProperty, deleteProperty, deleteAllProperties, updatePropertyImage,
    deleteIdentity, deleteAllIdentities,
    addToCash,
    addRobbery, getRobberies, getRobberyById, getRobberyByName, updateRobbery, deleteRobbery,
    checkLoginAndIdentity,
    createSnapAccount, getSnapAccount, getSnapAccountByUsername,
    addSnapFriend, acceptSnapFriend, getSnapFriends, getPendingSnapRequests,
    sendSnap, getSnapInbox, markSnapSeen, getSnapConversation,
    createXAccount, getXAccount, deleteXAccount,
    postTweet, getXTimeline, likePost, deletePost, getPostById, retweetPost, replyPost,
    sendMessage, getMessages, markMessagesRead, getUnreadCount, addContact, getContacts,
    getShowroom, addShowroomCar, removeShowroomCar,
    getVehicles, addVehicle, removeVehicle,
    ensureIdentity, setActiveSlot, getActiveSlot, getActiveIdentity, getIdentityByIban, getAllActiveIdentities,
    transferMoney, transferItem, useItem, getTransactions, depositCash, withdrawCash,
    adminAddMoney, adminRemoveMoney, freezeAccount, unfreezeAccount, getIdentitiesByDiscordId,
    getImage, setImage,
    getInventory, addItem,
    getTickets, createTicket,
    getJobPrices, updateAllJobPrices, getJobCooldown, setJobCooldown,
    hasItem, removeItem, sellJobItems, sellJobItemsByCategory,
    JOB_ITEMS,
    CASE_STATUS,
    createCase, getCasesByPlaintiff, getCasesByStatus, getCaseById, getCasesByJudge,
    acceptCase, rejectCase, assignJudge, issueVerdict, assignLawyer,
    getCasesByLawyer, chargeLawyerFee, abandonCase,
    getLawyers, addLawyer, removeLawyer,
    createLawyerRequest, getLawyerRequests, getLawyerRequestById, updateLawyerRequest,
    getJudges, addJudge, removeJudge, getJudgeById,
    addViolation, removeViolation, getExpiredViolations, getViolationByUserId,
    createActivationRequest, getActivationRequest, deleteActivationRequest,
    getLastGathered, setLastGathered, getItemQty,
    setMinistryDuty, getMinistryDuty,
    createFakeIdentity, getFakeIdentity, deleteFakeIdentity,
    setCiaDuty, getCiaDuty, getAllActiveCia,
    addPriorityButton, removePriorityButton, getPriorityButtons,
    addTicketType, removeTicketType, getTicketTypes,
    createPendingCompany, getPendingCompany, getAllPendingCompanies, updatePendingCompanyStatus,
    hasTradePermit, grantTradePermit, revokeTradePermit, getAllTradePermits,
    createCompany, getCompanyByOwner, getCompanyByMember, getUserCompany, getCompanyById,
    getCompanyMembers, addCompanyMember, removeCompanyMember, updateCompanyMemberRole,
    depositToCompany, withdrawFromCompany, payCompanySalaries, getAllCompanies, dissolveCompany,
    createOpenTicket, getOpenTicketByChannel, removeOpenTicket,
    addStaffActivity, addStaffManualPoints, getStaffActivity, getAllStaffActivity,
    cuffPlayer, uncuffPlayer, isCuffed,
};

/* ─── نظام الكلبشة ─────────────────────────────────────────────────────── */
async function cuffPlayer(targetId, cuffedById) {
    await pool.query(`
        INSERT INTO cuffed_players (discord_id, cuffed_by)
        VALUES ($1, $2)
        ON CONFLICT (discord_id) DO UPDATE SET cuffed_by = $2, cuffed_at = NOW()
    `, [targetId, cuffedById]);
}

async function uncuffPlayer(targetId) {
    await pool.query('DELETE FROM cuffed_players WHERE discord_id = $1', [targetId]);
}

async function isCuffed(discordId) {
    const res = await pool.query('SELECT cuffed_by, cuffed_at FROM cuffed_players WHERE discord_id = $1', [discordId]);
    return res.rows[0] || null;
}

async function initCuffedTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS cuffed_players (
            discord_id  VARCHAR PRIMARY KEY,
            cuffed_by   VARCHAR NOT NULL,
            cuffed_at   TIMESTAMP DEFAULT NOW()
        );
    `);
}
initCuffedTable().catch(console.error);

/* ─── جدول آخر تجميع (لمنع التكرار) ─── */
async function initGatheringTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS gathering_last (
            user_id     TEXT PRIMARY KEY,
            resource    TEXT NOT NULL,
            updated_at  TIMESTAMP DEFAULT NOW()
        );
    `);
}
initGatheringTable().catch(console.error);

async function getLastGathered(userId) {
    const res = await pool.query('SELECT resource FROM gathering_last WHERE user_id=$1', [userId]);
    return res.rows[0]?.resource || null;
}

async function setLastGathered(userId, resource) {
    await pool.query(
        `INSERT INTO gathering_last (user_id, resource, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET resource=$2, updated_at=NOW()`,
        [userId, resource]
    );
}

async function getItemQty(discordId, itemName) {
    const res = await pool.query(
        'SELECT quantity FROM inventory WHERE discord_id=$1 AND LOWER(item_name)=LOWER($2)',
        [discordId, itemName]
    );
    return res.rows[0] ? Number(res.rows[0].quantity) : 0;
}

/* ─── جدول المخالفات ─── */
async function initViolationsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS violations (
            id          SERIAL PRIMARY KEY,
            user_id     TEXT NOT NULL,
            admin_id    TEXT NOT NULL,
            reason      TEXT NOT NULL,
            expires_at  TIMESTAMP NOT NULL,
            saved_roles TEXT NOT NULL DEFAULT '[]',
            created_at  TIMESTAMP DEFAULT NOW()
        );
    `);
    // إضافة العمود إن لم يكن موجوداً في جداول قديمة
    await pool.query(`ALTER TABLE violations ADD COLUMN IF NOT EXISTS saved_roles TEXT NOT NULL DEFAULT '[]';`);
}
initViolationsTable().catch(console.error);

async function addViolation(userId, adminId, reason, expiresAt, savedRoles = []) {
    // احذف المخالفة القديمة إن وُجدت أولاً
    await pool.query(`DELETE FROM violations WHERE user_id=$1`, [userId]);
    await pool.query(
        `INSERT INTO violations (user_id, admin_id, reason, expires_at, saved_roles)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, adminId, reason, expiresAt, JSON.stringify(savedRoles)]
    );
}

async function removeViolation(userId) {
    await pool.query(`DELETE FROM violations WHERE user_id = $1`, [userId]);
}

async function getExpiredViolations() {
    const res = await pool.query(`SELECT * FROM violations WHERE expires_at <= NOW()`);
    return res.rows;
}

async function getViolationByUserId(userId) {
    const res = await pool.query(`SELECT * FROM violations WHERE user_id = $1 LIMIT 1`, [userId]);
    return res.rows[0] || null;
}

/* ─── جدول طلبات التفعيل ─── */
async function initActivationTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS activation_requests (
            id         SERIAL PRIMARY KEY,
            user_id    TEXT NOT NULL UNIQUE,
            username   TEXT NOT NULL,
            sony_id    TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);
}
initActivationTable().catch(console.error);

async function createActivationRequest(userId, username, sonyId) {
    await pool.query(
        `INSERT INTO activation_requests (user_id, username, sony_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET sony_id=$3, username=$2, created_at=NOW()`,
        [userId, username, sonyId]
    );
    const res = await pool.query(`SELECT * FROM activation_requests WHERE user_id=$1`, [userId]);
    return res.rows[0];
}

async function getActivationRequest(id) {
    const res = await pool.query(`SELECT * FROM activation_requests WHERE id=$1`, [id]);
    return res.rows[0] || null;
}

async function deleteActivationRequest(id) {
    await pool.query(`DELETE FROM activation_requests WHERE id=$1`, [id]);
}

/* ─── جداول التكتات ─── */
(async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ticket_types (
            id         SERIAL PRIMARY KEY,
            name       TEXT NOT NULL,
            emoji      TEXT NOT NULL DEFAULT '🎫',
            role_id    TEXT
        );
        CREATE TABLE IF NOT EXISTS open_tickets (
            id         SERIAL PRIMARY KEY,
            discord_id TEXT NOT NULL,
            channel_id TEXT NOT NULL UNIQUE,
            type_id    INT,
            type_name  TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);
    await pool.query(`ALTER TABLE ticket_types ADD COLUMN IF NOT EXISTS role_id TEXT`);
})().catch(console.error);

async function addTicketType(name, emoji, roleId = null) {
    const res = await pool.query(
        `INSERT INTO ticket_types (name, emoji, role_id) VALUES ($1, $2, $3) RETURNING *`,
        [name, emoji, roleId]
    );
    return res.rows[0];
}

async function removeTicketType(id) {
    const res = await pool.query(`DELETE FROM ticket_types WHERE id=$1 RETURNING *`, [id]);
    return res.rows[0] || null;
}

async function getTicketTypes() {
    const res = await pool.query(`SELECT * FROM ticket_types ORDER BY id`);
    return res.rows;
}

async function createOpenTicket(discordId, channelId, typeId, typeName) {
    const res = await pool.query(
        `INSERT INTO open_tickets (discord_id, channel_id, type_id, type_name)
         VALUES ($1, $2, $3, $4) ON CONFLICT (channel_id) DO NOTHING RETURNING *`,
        [discordId, channelId, typeId, typeName]
    );
    return res.rows[0];
}

async function getOpenTicketByChannel(channelId) {
    const res = await pool.query(`SELECT * FROM open_tickets WHERE channel_id=$1`, [channelId]);
    return res.rows[0] || null;
}

async function removeOpenTicket(channelId) {
    await pool.query(`DELETE FROM open_tickets WHERE channel_id=$1`, [channelId]);
}

/* ─── جدول نقاط الإدارة ─── */
(async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS staff_activity (
            discord_id    VARCHAR PRIMARY KEY,
            trips_count   INT DEFAULT 0,
            gmc_count     INT DEFAULT 0,
            tickets_count INT DEFAULT 0,
            manual_points INT DEFAULT 0
        )
    `);
})().catch(console.error);

async function addStaffActivity(discordId, field) {
    const allowed = ['trips_count', 'gmc_count', 'tickets_count'];
    if (!allowed.includes(field)) return;
    await pool.query(`
        INSERT INTO staff_activity (discord_id, ${field})
        VALUES ($1, 1)
        ON CONFLICT (discord_id)
        DO UPDATE SET ${field} = staff_activity.${field} + 1
    `, [discordId]);
}

async function addStaffManualPoints(discordId, amount) {
    await pool.query(`
        INSERT INTO staff_activity (discord_id, manual_points)
        VALUES ($1, $2)
        ON CONFLICT (discord_id)
        DO UPDATE SET manual_points = staff_activity.manual_points + $2
    `, [discordId, amount]);
}

async function getStaffActivity(discordId) {
    const res = await pool.query('SELECT * FROM staff_activity WHERE discord_id=$1', [discordId]);
    return res.rows[0] || { discord_id: discordId, trips_count: 0, gmc_count: 0, tickets_count: 0, manual_points: 0 };
}

async function getAllStaffActivity() {
    const res = await pool.query(`
        SELECT *,
            (trips_count * 5 + gmc_count * 8 + tickets_count * 5 + manual_points) AS total
        FROM staff_activity
        ORDER BY total DESC
    `);
    return res.rows;
}

/* ─── جداول نظام الشركات ─── */
(async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS pending_companies (
            id               SERIAL PRIMARY KEY,
            discord_id       TEXT NOT NULL,
            username         TEXT,
            company_name     TEXT NOT NULL,
            personal_info    TEXT,
            company_details  TEXT,
            management_plan  TEXT,
            financial_info   TEXT,
            status           TEXT DEFAULT 'pending',
            reviewed_by      TEXT,
            reviewed_at      TIMESTAMPTZ,
            created_at       TIMESTAMPTZ DEFAULT NOW()
        );
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS trade_permits (
            discord_id  TEXT PRIMARY KEY,
            granted_by  TEXT NOT NULL,
            granted_at  TIMESTAMPTZ DEFAULT NOW()
        );
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS companies (
            id               SERIAL PRIMARY KEY,
            name             TEXT UNIQUE NOT NULL,
            owner_discord_id TEXT NOT NULL,
            balance          BIGINT DEFAULT 0,
            created_at       TIMESTAMPTZ DEFAULT NOW()
        );
    `);
    await pool.query(`ALTER TABLE company_members ADD COLUMN IF NOT EXISTS salary BIGINT DEFAULT 0`).catch(() => {});
    await pool.query(`
        CREATE TABLE IF NOT EXISTS company_members (
            id          SERIAL PRIMARY KEY,
            company_id  INT REFERENCES companies(id) ON DELETE CASCADE,
            discord_id  TEXT NOT NULL,
            role        TEXT DEFAULT 'موظف',
            salary      BIGINT DEFAULT 0,
            joined_at   TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(company_id, discord_id)
        );
    `);
})().catch(console.error);

async function createPendingCompany(data) {
    const res = await query(
        `INSERT INTO pending_companies (discord_id, username, company_name, personal_info, company_details, management_plan, financial_info)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [data.discordId, data.username, data.companyName, data.personalInfo, data.companyDetails, data.managementPlan, data.financialInfo]
    );
    return res.rows[0];
}
async function getPendingCompany(id) {
    const res = await query('SELECT * FROM pending_companies WHERE id=$1', [id]);
    return res.rows[0] || null;
}
async function getAllPendingCompanies() {
    const res = await query(`SELECT * FROM pending_companies WHERE status='pending' ORDER BY created_at ASC`, []);
    return res.rows;
}
async function updatePendingCompanyStatus(id, status, reviewedBy) {
    await query('UPDATE pending_companies SET status=$2, reviewed_by=$3, reviewed_at=NOW() WHERE id=$1', [id, status, reviewedBy]);
}

async function hasTradePermit(discordId) {
    const res = await query('SELECT 1 FROM trade_permits WHERE discord_id=$1', [discordId]);
    return res.rows.length > 0;
}
async function grantTradePermit(discordId, grantedBy) {
    await query(
        `INSERT INTO trade_permits (discord_id, granted_by) VALUES ($1, $2)
         ON CONFLICT (discord_id) DO UPDATE SET granted_by=$2, granted_at=NOW()`,
        [discordId, grantedBy]
    );
}
async function revokeTradePermit(discordId) {
    const res = await query('DELETE FROM trade_permits WHERE discord_id=$1 RETURNING *', [discordId]);
    return res.rows.length > 0;
}
async function getAllTradePermits() {
    const res = await query('SELECT * FROM trade_permits ORDER BY granted_at DESC', []);
    return res.rows;
}
async function createCompany(name, ownerDiscordId) {
    const existing = await query('SELECT id FROM companies WHERE owner_discord_id=$1', [ownerDiscordId]);
    if (existing.rows.length > 0) return { error: 'أنت تمتلك شركة بالفعل.' };
    const nameTaken = await query('SELECT id FROM companies WHERE LOWER(name)=LOWER($1)', [name]);
    if (nameTaken.rows.length > 0) return { error: 'اسم الشركة مأخوذ.' };
    const res = await query(
        `INSERT INTO companies (name, owner_discord_id) VALUES ($1, $2) RETURNING *`,
        [name, ownerDiscordId]
    );
    return { company: res.rows[0] };
}
async function getCompanyByOwner(discordId) {
    const res = await query('SELECT * FROM companies WHERE owner_discord_id=$1', [discordId]);
    return res.rows[0] || null;
}
async function getCompanyByMember(discordId) {
    const res = await query(
        `SELECT c.* FROM companies c
         JOIN company_members m ON m.company_id=c.id
         WHERE m.discord_id=$1`,
        [discordId]
    );
    return res.rows[0] || null;
}
async function getUserCompany(discordId) {
    const owned = await getCompanyByOwner(discordId);
    if (owned) return { ...owned, userRole: 'مالك' };
    const member = await getCompanyByMember(discordId);
    if (!member) return null;
    const roleRes = await query('SELECT role FROM company_members WHERE company_id=$1 AND discord_id=$2', [member.id, discordId]);
    return { ...member, userRole: roleRes.rows[0]?.role || 'موظف' };
}
async function getCompanyById(id) {
    const res = await query('SELECT * FROM companies WHERE id=$1', [id]);
    return res.rows[0] || null;
}
async function getCompanyMembers(companyId) {
    const res = await query('SELECT * FROM company_members WHERE company_id=$1 ORDER BY joined_at', [companyId]);
    return res.rows;
}
async function addCompanyMember(companyId, discordId, role = 'موظف', salary = 0) {
    const existing = await query('SELECT id FROM company_members WHERE company_id=$1 AND discord_id=$2', [companyId, discordId]);
    if (existing.rows.length > 0) return { error: 'هذا الشخص عضو بالفعل.' };
    await query(`INSERT INTO company_members (company_id, discord_id, role, salary) VALUES ($1, $2, $3, $4)`, [companyId, discordId, role, salary]);
    return { success: true };
}
async function removeCompanyMember(companyId, discordId) {
    const res = await query('DELETE FROM company_members WHERE company_id=$1 AND discord_id=$2 RETURNING *', [companyId, discordId]);
    return res.rows.length > 0;
}
async function updateCompanyMemberRole(companyId, discordId, role, salary = null) {
    if (salary !== null) {
        await query('UPDATE company_members SET role=$3, salary=$4 WHERE company_id=$1 AND discord_id=$2', [companyId, discordId, role, salary]);
    } else {
        await query('UPDATE company_members SET role=$3 WHERE company_id=$1 AND discord_id=$2', [companyId, discordId, role]);
    }
}
async function depositToCompany(companyId, discordId, slot, amount) {
    const cashRes = await query('SELECT cash FROM identities WHERE discord_id=$1 AND slot=$2', [discordId, slot]);
    const cash = cashRes.rows[0]?.cash || 0;
    if (cash < amount) return { error: 'رصيدك النقدي غير كافٍ.' };
    await query('UPDATE identities SET cash=cash-$1 WHERE discord_id=$2 AND slot=$3', [amount, discordId, slot]);
    await query('UPDATE companies SET balance=balance+$1 WHERE id=$2', [amount, companyId]);
    return { success: true };
}
async function withdrawFromCompany(companyId, discordId, slot, amount) {
    const compRes = await query('SELECT balance FROM companies WHERE id=$1', [companyId]);
    const balance = compRes.rows[0]?.balance || 0;
    if (balance < amount) return { error: 'رصيد الشركة غير كافٍ.' };
    await query('UPDATE companies SET balance=balance-$1 WHERE id=$2', [amount, companyId]);
    await query('UPDATE identities SET cash=cash+$1 WHERE discord_id=$2 AND slot=$3', [amount, discordId, slot]);
    return { success: true };
}
async function payCompanySalaries(companyId) {
    const compRes = await query('SELECT balance FROM companies WHERE id=$1', [companyId]);
    const balance = compRes.rows[0]?.balance || 0;
    const members = await query(
        'SELECT discord_id, salary FROM company_members WHERE company_id=$1 AND salary>0',
        [companyId]
    );
    if (members.rows.length === 0) return { error: 'لا يوجد موظفون برواتب محددة.' };
    const total = members.rows.reduce((sum, m) => sum + parseInt(m.salary || 0), 0);
    if (balance < total) return {
        error: `رصيد الشركة غير كافٍ. المطلوب: **${total.toLocaleString()} ريال**، المتوفر: **${balance.toLocaleString()} ريال**.`
    };
    await query('UPDATE companies SET balance=balance-$1 WHERE id=$2', [total, companyId]);
    for (const m of members.rows) {
        await query(
            `UPDATE identities SET cash=cash+$1 WHERE discord_id=$2
             AND slot=(SELECT MIN(slot) FROM identities WHERE discord_id=$2)`,
            [parseInt(m.salary), m.discord_id]
        );
    }
    return { success: true, total, members: members.rows };
}
async function getAllCompanies() {
    const res = await query('SELECT * FROM companies ORDER BY created_at DESC', []);
    return res.rows;
}
async function dissolveCompany(companyId) {
    await query('DELETE FROM companies WHERE id=$1', [companyId]);
}

/* ─── جدول أزرار الأولوية ─── */
(async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS priority_buttons (
            id          SERIAL PRIMARY KEY,
            label       TEXT NOT NULL,
            priority    TEXT NOT NULL,
            style       TEXT NOT NULL DEFAULT 'Primary'
        );
    `);
})().catch(console.error);

(async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ministry_duty (
            discord_id  TEXT PRIMARY KEY,
            status      TEXT DEFAULT 'off',
            updated_at  TIMESTAMPTZ DEFAULT NOW()
        );
    `);
})().catch(console.error);

async function setMinistryDuty(discordId, status) {
    await pool.query(
        `INSERT INTO ministry_duty (discord_id, status, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (discord_id) DO UPDATE SET status=$2, updated_at=NOW()`,
        [discordId, status]
    );
}
async function getMinistryDuty(discordId) {
    const res = await pool.query('SELECT * FROM ministry_duty WHERE discord_id=$1', [discordId]);
    return res.rows[0] || null;
}

/* ─── جدول الهويات المزيفة ─── */
(async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS fake_identities (
            id          SERIAL PRIMARY KEY,
            target_id   TEXT NOT NULL,
            issuer_id   TEXT NOT NULL,
            fake_name   TEXT NOT NULL,
            fake_iban   TEXT NOT NULL,
            expires_at  TIMESTAMPTZ NOT NULL,
            created_at  TIMESTAMPTZ DEFAULT NOW()
        );
    `);
})().catch(console.error);

async function createFakeIdentity(targetId, issuerId, fakeName, fakeIban, expiresAt) {
    await pool.query(`DELETE FROM fake_identities WHERE target_id=$1`, [targetId]);
    const res = await pool.query(
        `INSERT INTO fake_identities (target_id, issuer_id, fake_name, fake_iban, expires_at)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [targetId, issuerId, fakeName, fakeIban, expiresAt]
    );
    return res.rows[0];
}
async function getFakeIdentity(targetId) {
    const res = await pool.query(`SELECT * FROM fake_identities WHERE target_id=$1 AND expires_at > NOW()`, [targetId]);
    return res.rows[0] || null;
}
async function deleteFakeIdentity(targetId) {
    await pool.query(`DELETE FROM fake_identities WHERE target_id=$1`, [targetId]);
}

/* ─── جدول حضور CIA ─── */
(async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS cia_duty (
            discord_id  TEXT PRIMARY KEY,
            status      TEXT DEFAULT 'off',
            updated_at  TIMESTAMPTZ DEFAULT NOW()
        );
    `);
})().catch(console.error);

async function setCiaDuty(discordId, status) {
    await pool.query(
        `INSERT INTO cia_duty (discord_id, status, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (discord_id) DO UPDATE SET status=$2, updated_at=NOW()`,
        [discordId, status]
    );
}
async function getCiaDuty(discordId) {
    const res = await pool.query('SELECT * FROM cia_duty WHERE discord_id=$1', [discordId]);
    return res.rows[0] || null;
}
async function getAllActiveCia() {
    const res = await pool.query(`SELECT * FROM cia_duty WHERE status='on' ORDER BY updated_at ASC`);
    return res.rows;
}

async function addPriorityButton(label, priority, style) {
    const res = await pool.query(
        `INSERT INTO priority_buttons (label, priority, style) VALUES ($1, $2, $3) RETURNING *`,
        [label, priority, style]
    );
    return res.rows[0];
}

async function removePriorityButton(id) {
    const res = await pool.query(`DELETE FROM priority_buttons WHERE id=$1 RETURNING *`, [id]);
    return res.rows[0] || null;
}

async function getPriorityButtons() {
    const res = await pool.query(`SELECT * FROM priority_buttons ORDER BY id`);
    return res.rows;
}
