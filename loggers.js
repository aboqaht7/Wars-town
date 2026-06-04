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
    tracking:           { key: 'tracking_log_channel', label: 'لوق التراكينق (CIA)' },
    ticket:             { key: 'ticket_log_channel',   label: 'لوق التكتات' },
    identity:           { key: 'identity_log_channel', label: 'لوق الهويات' },
    vehicle:            { key: 'vehicle_log_channel',  label: 'لوق المركبات' },
    bank:               { key: 'bank_log_channel',     label: 'لوق البنك والمعاملات' },
    police:             { key: 'police_log_channel',   label: 'لوق الشرطة (كلبشة، سرقة)' },
    property:           { key: 'property_log_channel', label: 'لوق العقارات' },
    market:             { key: 'market_log_channel',   label: 'لوق الماركت والنقل' },
    admin:              { key: 'admin_log_channel',    label: 'لوق أوامر الأدمن' },
    general:            { key: 'general_log_channel',  label: 'لوق عام (احتياطي)' },
};

module.exports = { logEvent, LOG_TYPES };
