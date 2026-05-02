async function logEvent(client, db, type, embed) {
    try {
        let channelId = await db.getConfig(`${type}_log_channel`).catch(() => null);
        if (!channelId) {
            channelId = await db.getConfig('general_log_channel').catch(() => null);
        }
        if (!channelId) return;
        const ch = await client.channels.fetch(channelId).catch(() => null);
        if (ch) await ch.send({ embeds: [embed] }).catch(() => {});
    } catch (e) {
        console.error(`[LOG ${type}]`, e?.message || e);
    }
}

const LOG_TYPES = {
    band:               { key: 'band_log_channel',     label: 'لوق الباند والطرد' },
    config:             { key: 'config_log_channel',   label: 'لوق إعدادات الإدارة' },
    backup:             { key: 'backup_log_channel',   label: 'لوق النسخ الاحتياطية' },
    general:            { key: 'general_log_channel',  label: 'لوق عام (احتياطي)' },
};

module.exports = { logEvent, LOG_TYPES };
