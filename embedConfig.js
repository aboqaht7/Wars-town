/**
 * تسجيل الامبدات القابلة للتخصيص.
 * مفتاح كل امبد + الحقول الافتراضية (title/description/footer/placeholder).
 * عند التحميل: ندمج الافتراضيات مع التجاوزات في DB (server_config: embedcfg:{key}:{field}).
 */

const EMBED_DEFAULTS = {
    // ── CIA ──────────────────────────────────────────────
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

    // ── أنظمة عامة ────────────────────────────────────────
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
    admin: {
        title:       'Admin System',
        description: 'Admin control panel — choose from the menu below.',
        footer:      'Admin System • FANTASY Bot',
        placeholder: 'Choose an option',
    },
    bag: {
        title:       'Inventory',
        description: 'Select what you want to do with your bag.',
        footer:      'Bag System • FANTASY Bot',
    },
    crime: {
        title:       'Robbery System',
        description: 'Choose the robbery you want to execute from the list.',
        footer:      'Robbery System • FANTASY Bot',
        placeholder: '⛓️ Choose a robbery',
    },
    flight: {
        title:       'Trips & Events',
        description: 'Choose the event type you want to activate',
        footer:      'Events System • FANTASY Bot',
        placeholder: 'Choose event type',
    },
    health: {
        title:       'Ministry of Health',
        description: 'Choose the medical service you need.',
        footer:      'Health System • FANTASY Bot',
        placeholder: '🏥 Choose a medical service',
    },
    jobs: {
        title:       'Free Jobs',
        description: '> Choose your job from the menu below',
        footer:      'Jobs System • FANTASY Bot',
        placeholder: 'Choose your job',
    },
    law: {
        title:       'Law Office',
        description: '> Choose the legal service from the menu below',
        footer:      'Law System • FANTASY Bot',
        placeholder: '⚖️ Choose a legal service',
    },
    market: {
        title:       'Store',
        description: 'Choose the item you want to buy from the list.',
        footer:      'Store System • FANTASY Bot',
        placeholder: '🛒 Choose an item',
    },
    phone: {
        title:       'Phone',
        description: '> Choose the service you need from the menu below',
        footer:      'Phone System • FANTASY Bot',
        placeholder: '📱 Choose a service',
    },
    properties: {
        title:       'Real Estate Gallery',
        description: 'Choose the property you want to inquire about or purchase from the list.',
        footer:      'Properties System • FANTASY Bot',
        placeholder: '🏠 Choose a property',
    },
    tickets: {
        title:       '🎫 نظام التكتات',
        description: 'اختر نوع التكت من القائمة أدناه وسيُفتح لك روم خاص.',
        footer:      'FANTASY Bot • Ticket System',
        placeholder: '🎫 اختر نوع التكت',
    },
    black_market: {
        title:       'Black Market',
        description: 'Choose the item you want to buy from the list.',
        footer:      'Black Market • FANTASY Bot',
        placeholder: '🔫 Choose an item',
    },
    judge_dashboard: {
        title:       'Certified Judges',
        description: '',
        footer:      'Justice System • FANTASY Bot',
        placeholder: '🏛️ Choose a judge to view their cases',
    },
    justice: {
        title:       'Justice System',
        description: '> Manage filed cases — choose an action from the menu',
        footer:      'Justice System • FANTASY Bot',
        placeholder: '🏛️ Choose an action',
    },
    equipment: {
        title:       'Equipment Store',
        description: 'Choose equipment from the list below.',
        footer:      'Equipment Store • FANTASY Bot',
        placeholder: '🔨 Choose equipment',
    },
    central_market: {
        title:       'Central Market',
        description: '> Choose the category you want to sell from the menu\n> Prices refresh automatically every hour\n\u200B',
        footer:      'Central Market • FANTASY Bot',
        placeholder: '🏪 Choose what to sell',
    },
    lawyer_dashboard: {
        title:       'Certified Lawyers',
        description: '',
        footer:      'Law System • FANTASY Bot',
        placeholder: '👤 Choose a lawyer to view their dashboard',
    },
    lawyer_tasks: {
        title:       'Lawyers Tasks',
        description: '> Choose your name from the list below to access your personal tasks board.\n> No lawyer can access another lawyer\'s board.',
        footer:      'Law System • FANTASY Bot',
        placeholder: 'Choose your name...',
    },
    x_platform: {
        title:       '𝕏 Platform',
        description: '',
        footer:      'X Platform • FANTASY Bot',
    },
    showroom: {
        title:       'Car Showroom',
        description: '',
        footer:      'Showroom System • FANTASY Bot',
        placeholder: 'Choose a car to inquire about',
    },
    vehicles: {
        title:       'My Registered Cars',
        description: 'View your registered cars in the FANTASY system.',
        footer:      'Vehicles System • FANTASY Bot',
        placeholder: 'Choose an option',
    },
    snap: {
        title:       'Snapchat',
        description: 'Send snaps and connect with your friends.',
        footer:      'Snapchat • FANTASY Bot',
        placeholder: '👻 Choose from the menu',
    },
    trips: {
        title:       'Trip System',
        description: '> Choose the required action from the buttons below.\n\n✈️ **Start Trip** — Open a new trip and send the notification\n🌪️ **Hurricane** — End the trip and send the hurricane warning\n🔄 **Renew** — Renew a trip with the host ID\n📣 **Alert** — Send a custom alert to the alerts channel',
        footer:      'Trip System • FANTASY Bot',
    },
};

const EMBED_LABELS = {
    cia:                'لوحة CIA',
    tracking:           'لوحة التراكينق',
    citizen_file_list:  'قائمة ملفات المواطنين',
    bank:               'لوحة البنك',
    identity:           'لوحة الهوية',
    help:               'قائمة المساعدة',
    admin:              'لوحة الإدارة',
    bag:                'الحقيبة',
    crime:              'الجرائم',
    flight:             'الرحلات والأحداث',
    health:             'وزارة الصحة',
    jobs:               'الوظائف',
    law:                'مكتب المحاماة',
    market:             'السوق',
    phone:              'الجوال',
    properties:         'العقارات',
    tickets:            'التكتات',
    black_market:       'السوق السوداء',
    judge_dashboard:    'لوحة القضاة',
    justice:            'العدالة',
    equipment:          'متجر المعدات',
    central_market:     'السوق المركزي',
    lawyer_dashboard:   'لوحة المحامين',
    lawyer_tasks:       'مهام المحامين',
    x_platform:         'منصة X',
    showroom:           'معرض السيارات',
    vehicles:           'السيارات المسجلة',
    snap:               'سناب شات',
    trips:              'الرحلات',
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
