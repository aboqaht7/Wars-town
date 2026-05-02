const { spawn } = require('child_process');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = '/tmp/fantasy_backups';

function ensureDir() {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function timestamp() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
}

async function createBackup() {
    ensureDir();
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('DATABASE_URL غير معرّف.');

    const u = new URL(dbUrl);
    const env = {
        ...process.env,
        PGPASSWORD: decodeURIComponent(u.password || ''),
    };

    const filePath = path.join(BACKUP_DIR, `backup_${timestamp()}.sql`);
    const args = [
        '-h', u.hostname,
        '-p', u.port || '5432',
        '-U', decodeURIComponent(u.username || ''),
        '-d', (u.pathname || '').replace(/^\//, ''),
        '--no-owner',
        '--no-privileges',
        '-f', filePath,
    ];

    return new Promise((resolve, reject) => {
        const proc = spawn('pg_dump', args, { env });
        let stderr = '';
        proc.stderr.on('data', d => { stderr += d.toString(); });
        proc.on('error', reject);
        proc.on('close', code => {
            if (code !== 0) return reject(new Error(`pg_dump فشل (كود ${code}): ${stderr}`));
            try {
                const stat = fs.statSync(filePath);
                resolve({ filePath, size: stat.size });
            } catch (e) { reject(e); }
        });
    });
}

async function sendBackupToChannel(client, db, options = {}) {
    const channelId = await db.getConfig('backup_log_channel').catch(() => null);
    if (!channelId) {
        if (options.silent) return null;
        throw new Error('روم النسخ الاحتياطية غير معيّن. استخدم `/تعيين-لوق` بنوع "نسخ احتياطية".');
    }
    const ch = await client.channels.fetch(channelId).catch(() => null);
    if (!ch) throw new Error('روم النسخ الاحتياطية غير موجود.');

    const { filePath, size } = await createBackup();
    const sizeMB = (size / 1024 / 1024).toFixed(2);

    const { EmbedBuilder } = require('discord.js');
    const embed = new EmbedBuilder()
        .setTitle('نسخة احتياطية للداتابيس')
        .setColor(0x2E7D32)
        .addFields(
            { name: 'الحجم', value: `${sizeMB} MB`, inline: true },
            { name: 'التوقيت', value: new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' }), inline: true },
            { name: 'النوع', value: options.auto ? 'تلقائية يومية' : 'يدوية', inline: true },
        )
        .setFooter({ text: 'نظام النسخ الاحتياطية • FANTASY Bot' })
        .setTimestamp();

    await ch.send({ embeds: [embed], files: [{ attachment: filePath, name: path.basename(filePath) }] });

    rotateLocalBackups(7);

    return { filePath, size };
}

function rotateLocalBackups(keep = 7) {
    try {
        ensureDir();
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
            .map(f => ({ f, t: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
            .sort((a, b) => b.t - a.t);
        for (const { f } of files.slice(keep)) {
            try { fs.unlinkSync(path.join(BACKUP_DIR, f)); } catch (_) {}
        }
    } catch (_) {}
}

module.exports = { createBackup, sendBackupToChannel, rotateLocalBackups, BACKUP_DIR };
