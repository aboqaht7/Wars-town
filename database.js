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
        `INSERT INTO users (discord_id, username) VALUES ($1, $2)
         ON CONFLICT (discord_id) DO UPDATE SET username = EXCLUDED.username`,
        [discordId, username]
    );
    await query(
        `INSERT INTO bank_accounts (discord_id) VALUES ($1)
         ON CONFLICT (discord_id) DO NOTHING`,
        [discordId]
    );
}

async function getImage(systemKey) {
    const res = await query('SELECT image_url FROM system_images WHERE system_key = $1', [systemKey]);
    return res.rows[0]?.image_url || null;
}

async function setImage(systemKey, imageUrl) {
    await query(
        `INSERT INTO system_images (system_key, image_url, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (system_key) DO UPDATE SET image_url = EXCLUDED.image_url, updated_at = NOW()`,
        [systemKey, imageUrl]
    );
}

async function getBalance(discordId) {
    const res = await query('SELECT balance FROM bank_accounts WHERE discord_id = $1', [discordId]);
    return res.rows[0]?.balance ?? 0;
}

async function setBalance(discordId, amount) {
    await query(
        `INSERT INTO bank_accounts (discord_id, balance) VALUES ($1, $2)
         ON CONFLICT (discord_id) DO UPDATE SET balance = $2, updated_at = NOW()`,
        [discordId, amount]
    );
}

async function addBalance(discordId, amount) {
    await query(
        `UPDATE bank_accounts SET balance = balance + $2, updated_at = NOW() WHERE discord_id = $1`,
        [discordId, amount]
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
    await query(
        `INSERT INTO inventory (discord_id, item_name, quantity) VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [discordId, itemName, quantity]
    );
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

module.exports = { query, ensureUser, getImage, setImage, getBalance, setBalance, addBalance, getInventory, addItem, getTickets, createTicket };
