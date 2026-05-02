const { ButtonBuilder, ButtonStyle } = require('discord.js');

const STYLE_MAP = {
    primary:   ButtonStyle.Primary,
    secondary: ButtonStyle.Secondary,
    success:   ButtonStyle.Success,
    danger:    ButtonStyle.Danger,
    ازرق:     ButtonStyle.Primary,
    رمادي:    ButtonStyle.Secondary,
    اخضر:     ButtonStyle.Success,
    احمر:     ButtonStyle.Danger,
};

function parseEmoji(raw) {
    if (!raw) return null;
    // صيغة كاملة: <:name:id> أو <a:name:id>
    const full = raw.match(/^<(a?):(\w+):(\d+)>$/);
    if (full) return { animated: !!full[1], name: full[2], id: full[3] };
    // صيغة مختصرة: name:id
    const short = raw.match(/^(\w+):(\d+)$/);
    if (short) return { name: short[1], id: short[2] };
    // إيموجي Unicode أو نص — نتحقق أنه ليس بصيغة :name: بدون ID
    if (/^:\w+:$/.test(raw)) return null; // :name: بدون ID = غير صالح
    return raw;
}

const DEFAULTS = {
    bank: {
        balance:  { label: 'عرض الأموال',       emoji: '💰', style: 'primary'   },
        deposit:  { label: 'إيداع الكاش',        emoji: '📥', style: 'success'   },
        withdraw: { label: 'صرف الكاش',          emoji: '💸', style: 'danger'    },
        transfer: { label: 'تحويل',              emoji: '🔄', style: 'secondary' },
    },
    bag: {
        view:     { label: 'عرض الحقيبة',        emoji: '👀', style: 'primary'   },
        use:      { label: 'استخدام غرض',        emoji: '✅', style: 'success'   },
        transfer: { label: 'تحويل غرض',          emoji: '📤', style: 'secondary' },
    },
    cia: {
        login:    { label: 'تسجيل دخول',         emoji: '🟢', style: 'success'   },
        logout:   { label: 'تسجيل خروج',         emoji: '🔴', style: 'danger'    },
        active:   { label: 'كشف مباشرين',        emoji: '👥', style: 'primary'   },
        fake_id:  { label: 'إنشاء هوية مزيفة',  emoji: '🪪', style: 'secondary' },
    },
    stock: {
        buy:       { label: 'شراء أسهم',         emoji: '📈', style: 'success'   },
        sell:      { label: 'بيع أسهم',           emoji: '📉', style: 'danger'    },
        portfolio: { label: 'محفظتي',            emoji: '💼', style: 'primary'   },
    },
    x: {
        create: { label: 'إنشاء حساب',           emoji: '✨', style: 'primary'   },
        tweet:  { label: 'إرسال تغريدة',         emoji: '🐦', style: 'success'   },
        delete: { label: 'حذف الحساب',           emoji: '🗑️', style: 'danger'    },
    },
    snap: {
        create: { label: 'إنشاء حساب',           emoji: '✨', style: 'primary'   },
    },
    trips: {
        trip_start:     { label: 'بدء الرحلة',    emoji: '✈️', style: 'success'   },
        trip_hurricane: { label: 'إعصار',         emoji: '🌪️', style: 'danger'    },
        trip_renewal:   { label: 'تجديد الرحلة', emoji: '🔄', style: 'primary'   },
        trip_alert:     { label: 'تنبيه',         emoji: '📣', style: 'secondary' },
    },
    snap_menu: {
        send:     { label: 'إرسال سناب',     description: 'أرسل سناب لصديق',          emoji: '📸' },
        inbox:    { label: 'الوارد',          description: 'شوف السنابات اللي وصلتك',  emoji: '📬' },
        friends:  { label: 'أصدقائي',        description: 'قائمة أصدقائك والستريك',   emoji: '👥' },
        add:      { label: 'إضافة صديق',     description: 'أضف صديق باسم حساب سناب', emoji: '➕' },
        requests: { label: 'طلبات الصداقة',  description: 'اقبل طلبات الصداقة',      emoji: '🔔' },
    },
    health_menu: {
        hospital_resuscitation: { label: 'إنعاش المستشفى', description: 'تواصل مع طاقم المستشفى لإنعاشك' },
        witch_resuscitation:    { label: 'إنعاش الساحرة',  description: 'تواصل مع الساحرة للإنعاش' },
        decay:                  { label: 'التحلل',          description: 'شخصيتك في حالة تحلل' },
    },
    jobs_menu: {
        fishing:     { label: 'صيد السمك',    description: 'يتطلب: سنارة صيد' },
        woodcutting: { label: 'قطع الأشجار', description: 'يتطلب: فأس' },
        mining:      { label: 'التعدين',      description: 'يتطلب: أدوات تعدين' },
    },
    phone_menu: {
        report_police:    { label: 'بلاغ للشرطة', description: 'أرسل بلاغاً لفريق الشرطة' },
        report_ambulance: { label: 'بلاغ للإسعاف', description: 'أرسل بلاغاً لفريق الإسعاف' },
    },
    vehicles_menu: {
        view: { label: 'سياراتي', description: 'عرض سياراتك المسجلة' },
    },
    admin_menu: {
        ranks:  { label: 'عرض الرتب',       description: 'عرض جميع رتب الإدارة' },
        points: { label: 'نقاط الإدارة',    description: 'تحقق من نقاط الإدارة' },
        manage: { label: 'إدارة اللاعبين', description: 'صلاحيات الإدارة فقط' },
        logs:   { label: 'سجل الأحداث',    description: 'سجل جميع الإجراءات الإدارية' },
    },
    events_menu: {
        open_flight:   { label: 'فتح رحلة',  description: 'فتح رحلة جديدة' },
        hurricane:     { label: 'إعصار',     description: 'تفعيل حالة الإعصار' },
        alert:         { label: 'تنبيه عام', description: 'إرسال تنبيه للجميع' },
        special_event: { label: 'حدث خاص',  description: 'فتح حدث خاص' },
    },
    law_menu: {
        new_case:    { label: 'فتح قضية',    description: 'تقديم قضية جديدة للمحكمة' },
        my_cases:    { label: 'قضاياي',      description: 'عرض جميع قضاياك' },
        hire_lawyer: { label: 'توكيل محامٍ', description: 'طلب محامٍ لقضيتك' },
    },
    identity_menu: {
        create_identity: { label: 'إنشاء هوية',    description: 'أنشئ شخصية جديدة' },
        login_identity:  { label: 'تسجيل الدخول',  description: 'ادخل بشخصية معتمدة' },
        logout_identity: { label: 'تسجيل الخروج',  description: 'اخرج من شخصيتك الحالية' },
    },
    help_menu: {
        identity:   { label: 'الهوية',          description: 'عرض الشخصية والآيبان' },
        phone:      { label: 'الهاتف',          description: 'إرسال بلاغ للشرطة أو الإسعاف' },
        sms:        { label: 'الرسائل',         description: 'إرسال واستقبال الرسائل' },
        x_platform: { label: 'منصة X',          description: 'التغريد وإدارة الحساب' },
        bag:        { label: 'الحقيبة',         description: 'عرض الأغراض وتحويلها' },
        bank:       { label: 'البنك',           description: 'عرض الرصيد والتحويلات' },
        events:     { label: 'الرحلات',         description: 'فتح رحلة وإرسال تنبيه' },
        jobs:       { label: 'الوظائف',         description: 'اختيار الوظيفة والعمل' },
        market:     { label: 'سوق الأدوات',     description: 'شراء الأدوات والمعدات' },
        law:        { label: 'القانون',          description: 'رفع قضية وإدارة القضايا' },
        admin:      { label: 'الإدارة',         description: 'لوحة الإدارة والصلاحيات' },
        crime:      { label: 'الجرائم',         description: 'تنفيذ عمليات الجريمة' },
        tickets:    { label: 'التكتات',         description: 'شكوى أو اقتراح أو بلاغ' },
        vehicles:   { label: 'السيارات والمعرض', description: 'السيارات المسجلة والمعرض' },
    },
    justice_menu: {
        accept_case:    { label: 'قبول القضية',     description: 'قبول القضية المطروحة' },
        reject_case:    { label: 'رفض القضية',      description: 'رفض القضية المطروحة' },
        assign_judge:   { label: 'تعيين القاضي',   description: 'تعيين قاضٍ للقضية' },
        issue_verdict:  { label: 'إصدار الحكم',    description: 'إصدار الحكم النهائي للقضية' },
    },
    activation_menu: {
        activate_now: { label: 'تفعيل الحساب', description: 'تقديم طلب تفعيل الحساب' },
    },
    craft_weapon: {
        craft_sns:     { label: 'صناعة SNS',     description: 'مسدس SNS — يتطلب 200 من كل مادة' },
        craft_vintage: { label: 'صناعة Vintage', description: 'مسدس Vintage — يتطلب 300 من كل مادة' },
        craft_mkii:    { label: 'صناعة MK II',   description: 'مسدس MK II — يتطلب 500 من كل مادة' },
    },
    cia_tracking: {
        normal:    { label: 'تراكينق',           emoji: '🎯', style: 'danger'  },
        president: { label: 'تراكينق للرؤساء', emoji: '👑', style: 'primary' },
    },
};

const MENU_SYSTEMS = new Set([
    'snap_menu', 'health_menu', 'jobs_menu',
    'phone_menu', 'vehicles_menu', 'admin_menu',
    'events_menu', 'law_menu',
    'identity_menu', 'help_menu', 'justice_menu',
    'activation_menu', 'craft_weapon',
]);

const SYSTEM_LABELS = {
    bank:            'البنك',
    bag:             'الحقيبة',
    cia:             'CIA',
    stock:           'سوق الأسهم',
    x:               'منصة X',
    snap:            'سناب شات (أزرار)',
    trips:           'الرحلات (أزرار)',
    snap_menu:       'سناب شات (منيو)',
    health_menu:     'الصحة',
    jobs_menu:       'الوظائف',
    phone_menu:      'الهاتف',
    vehicles_menu:   'السيارات',
    admin_menu:      'الإدارة',
    events_menu:     'الرحلات والأحداث',
    law_menu:        'المحاماة',
    identity_menu:   'الهوية',
    help_menu:       'المساعدة',
    justice_menu:    'العدالة',
    activation_menu: 'التفعيل',
    craft_weapon:    'تصنيع السلاح',
    cia_tracking:    'تراكينق CIA',
};

const BTN_LABELS = {
    bank:            { balance: 'عرض الأموال', deposit: 'إيداع', withdraw: 'صرف', transfer: 'تحويل' },
    bag:             { view: 'عرض الحقيبة', use: 'استخدام غرض', transfer: 'تحويل غرض' },
    cia:             { login: 'دخول', logout: 'خروج', active: 'كشف مباشرين', fake_id: 'هوية مزيفة' },
    stock:           { buy: 'شراء', sell: 'بيع', portfolio: 'محفظتي' },
    x:               { create: 'إنشاء حساب', tweet: 'تغريدة', delete: 'حذف' },
    snap:            { create: 'إنشاء حساب' },
    trips:           { trip_start: 'بدء الرحلة', trip_hurricane: 'إعصار', trip_renewal: 'تجديد', trip_alert: 'تنبيه' },
    snap_menu:       { send: 'إرسال سناب', inbox: 'الوارد', friends: 'أصدقائي', add: 'إضافة صديق', requests: 'طلبات الصداقة' },
    health_menu:     { hospital_resuscitation: 'إنعاش المستشفى', witch_resuscitation: 'إنعاش الساحرة', decay: 'التحلل' },
    jobs_menu:       { fishing: 'صيد السمك', woodcutting: 'قطع الأشجار', mining: 'التعدين' },
    phone_menu:      { report_police: 'بلاغ للشرطة', report_ambulance: 'بلاغ للإسعاف' },
    vehicles_menu:   { view: 'سياراتي' },
    admin_menu:      { ranks: 'عرض الرتب', points: 'نقاط الإدارة', manage: 'إدارة اللاعبين', logs: 'سجل الأحداث' },
    events_menu:     { open_flight: 'فتح رحلة', hurricane: 'إعصار', alert: 'تنبيه عام', special_event: 'حدث خاص' },
    law_menu:        { new_case: 'فتح قضية', my_cases: 'قضاياي', hire_lawyer: 'توكيل محامٍ' },
    identity_menu:   { create_identity: 'إنشاء هوية', login_identity: 'تسجيل الدخول', logout_identity: 'تسجيل الخروج' },
    help_menu:       { identity: 'الهوية', phone: 'الهاتف', sms: 'الرسائل', x_platform: 'منصة X', bag: 'الحقيبة', bank: 'البنك', events: 'الرحلات', jobs: 'الوظائف', market: 'سوق الأدوات', law: 'القانون', admin: 'الإدارة', crime: 'الجرائم', tickets: 'التكتات', vehicles: 'السيارات' },
    justice_menu:    { accept_case: 'قبول القضية', reject_case: 'رفض القضية', assign_judge: 'تعيين القاضي', issue_verdict: 'إصدار الحكم' },
    activation_menu: { activate_now: 'تفعيل الحساب' },
    craft_weapon:    { craft_sns: 'صناعة SNS', craft_vintage: 'صناعة Vintage', craft_mkii: 'صناعة MK II' },
    cia_tracking:    { normal: 'تراكينق', president: 'تراكينق للرؤساء' },
};

async function loadSystemBtns(db, system) {
    const defaults = DEFAULTS[system] || {};
    const out = {};
    for (const key of Object.keys(defaults)) {
        const override = await db.getBtnCfg(system, key);
        out[key] = override ? { ...defaults[key], ...override } : { ...defaults[key] };
    }
    return out;
}

function makeBtn(customId, cfg) {
    const style = STYLE_MAP[(cfg.style || 'primary').toLowerCase()] ?? ButtonStyle.Primary;
    const btn = new ButtonBuilder()
        .setCustomId(customId)
        .setLabel(cfg.label || '—')
        .setStyle(style);
    if (cfg.emoji) {
        const parsed = parseEmoji(cfg.emoji);
        if (parsed) {
            try {
                btn.setEmoji(parsed);
            } catch (e) {
                console.warn(`[btnConfig] setEmoji failed for "${cfg.emoji}":`, e.message);
            }
        }
    }
    return btn;
}

function makeMenuOption(value, cfg) {
    const opt = {
        label: cfg.label || value,
        value,
    };
    if (cfg.description) opt.description = cfg.description;
    if (cfg.emoji) {
        const parsed = parseEmoji(cfg.emoji);
        if (parsed) {
            if (typeof parsed === 'string') {
                opt.emoji = { name: parsed };
            } else {
                opt.emoji = parsed;
            }
        }
    }
    return opt;
}

module.exports = {
    DEFAULTS, MENU_SYSTEMS, SYSTEM_LABELS, BTN_LABELS,
    parseEmoji, loadSystemBtns, makeBtn, makeMenuOption,
};
