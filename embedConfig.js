/**
 * تسجيل الامبدات القابلة للتخصيص.
 * كل امبد له مفتاح + الحقول الافتراضية (title/description/footer/placeholder).
 * عند التحميل: نمزج الافتراضيات مع التجاوزات المخزّنة في DB (server_config: embedcfg:{key}:{field}).
 */

const EMBED_DEFAULTS = {
    cia: {
        title:       'CIA — وكالة الاستخبارات',
        description: '',
        footer:      'CIA • FANTASY Bot',
    },
    tracking: {
        title:       'لوحة التراكينق — CIA',
        description: '',
        footer:      'CIA • FANTASY Bot',
    },
    citizen_file_list: {
        title:       'Citizen Files — CIA Intelligence',
        description: '',
        footer:      'CIA Intelligence System',
    },
    bank: {
        title:       'FANTASY Bank',
        description: 'Welcome to the bank. Choose the service you need.',
        footer:      'Bank System • FANTASY Bot',
    },
    identity: {
        title:       'Identity System',
        description: 'Create your identity and log in to start your journey in the world of FANTASY.',
        footer:      'Identity System • FANTASY Bot',
        placeholder: 'Choose an option',
    },
    help: {
        title:       'FANTASY Bot — Systems Menu',
        description: 'Choose a system from the menu below to view its details.',
        footer:      'FANTASY Bot • Comprehensive RP System',
        placeholder: 'Choose a system for details',
    },
};

const EMBED_LABELS = {
    cia:                'لوحة CIA',
    tracking:           'لوحة التراكينق',
    citizen_file_list:  'قائمة ملفات المواطنين',
    bank:               'لوحة البنك',
    identity:           'لوحة الهوية',
    help:               'قائمة المساعدة',
};

const FIELD_LABELS = {
    title:       'العنوان',
    description: 'الوصف',
    footer:      'التذييل',
    placeholder: 'نص السيلكت منيو',
};

async function loadEmbedCfg(db, key) {
    const def = EMBED_DEFAULTS[key] || {};
    const out = { ...def };
    for (const f of Object.keys(def)) {
        try {
            const ov = await db.getEmbedCfg(key, f);
            if (ov != null) out[f] = ov;
        } catch (_) {}
    }
    return out;
}

function applyEmbed(builder, cfg) {
    if (cfg.title)       builder.setTitle(cfg.title);
    if (cfg.description) builder.setDescription(cfg.description);
    if (cfg.footer)      builder.setFooter({ text: cfg.footer });
    return builder;
}

module.exports = { EMBED_DEFAULTS, EMBED_LABELS, FIELD_LABELS, loadEmbedCfg, applyEmbed };
