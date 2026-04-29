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
    snap_menu: {
        send:     { label: 'إرسال سناب',     description: 'أرسل سناب لصديق',          emoji: '📸' },
        inbox:    { label: 'الوارد',          description: 'شوف السنابات اللي وصلتك',  emoji: '📬' },
        friends:  { label: 'أصدقائي',        description: 'قائمة أصدقائك والستريك',   emoji: '👥' },
        add:      { label: 'إضافة صديق',     description: 'أضف صديق باسم حساب سناب', emoji: '➕' },
        requests: { label: 'طلبات الصداقة',  description: 'اقبل طلبات الصداقة',      emoji: '🔔' },
    },
    health_menu: {
        hospital_resuscitation: { label: '🏥 إنعاش المستشفى', description: 'تواصل مع طاقم المستشفى لإنعاشك' },
        witch_resuscitation:    { label: '🧙 إنعاش الساحرة',  description: 'تواصل مع الساحرة للإنعاش' },
        decay:                  { label: '💀 التحلل',          description: 'شخصيتك في حالة تحلل' },
    },
    jobs_menu: {
        fishing:     { label: '🎣 صيد السمك',    description: 'متطلبات: صنارة صيد' },
        woodcutting: { label: '🪓 قطع الأشجار', description: 'متطلبات: فأس' },
        mining:      { label: '⛏️ التعدين',      description: 'متطلبات: أدوات تعدين' },
    },
    phone_menu: {
        report_police:    { label: '🚨 بلاغ للشرطة', description: 'أرسل بلاغاً لفريق الشرطة' },
        report_ambulance: { label: '🚑 بلاغ للإسعاف', description: 'أرسل بلاغاً لفريق الإسعاف' },
    },
    vehicles_menu: {
        view: { label: '🚗 سياراتي', description: 'عرض سياراتك المسجلة' },
    },
    admin_menu: {
        ranks:  { label: '🏅 عرض الرتب',      description: 'عرض جميع الرتب' },
        points: { label: '⭐ نقاط الإدارة',   description: 'كشف نقاطك الإدارية' },
        manage: { label: '👥 إدارة اللاعبين', description: 'صلاحيات الأدمن فقط' },
        logs:   { label: '📋 سجل الأحداث',   description: 'سجل جميع الإجراءات الإدارية' },
    },
    events_menu: {
        open_flight:   { label: '✈️ فتح رحلة',  description: 'افتح رحلة جديدة' },
        hurricane:     { label: '🌪️ إعصار',     description: 'تفعيل حالة الإعصار' },
        alert:         { label: '📣 تنبيه عام', description: 'إرسال تنبيه للجميع' },
        special_event: { label: '🎉 حدث خاص',  description: 'فتح حدث خاص' },
    },
    law_menu: {
        new_case:    { label: '📁 فتح قضية',     description: 'تقديم قضية جديدة للمحكمة' },
        my_cases:    { label: '📋 قضاياي',       description: 'عرض جميع قضاياك' },
        hire_lawyer: { label: '👨‍⚖️ توكيل محامٍ', description: 'طلب محامٍ لقضيتك' },
    },
};

const MENU_SYSTEMS = new Set([
    'snap_menu', 'health_menu', 'jobs_menu',
    'phone_menu', 'vehicles_menu', 'admin_menu',
    'events_menu', 'law_menu',
]);

const SYSTEM_LABELS = {
    bank:          'البنك',
    bag:           'الحقيبة',
    cia:           'CIA',
    stock:         'سوق الأسهم',
    x:             'منصة X',
    snap:          'سناب شات (أزرار)',
    snap_menu:     'سناب شات (منيو)',
    health_menu:   'الصحة',
    jobs_menu:     'الوظائف',
    phone_menu:    'الهاتف',
    vehicles_menu: 'السيارات',
    admin_menu:    'الإدارة',
    events_menu:   'الرحلات والأحداث',
    law_menu:      'المحاماة',
};

const BTN_LABELS = {
    bank:          { balance: 'عرض الأموال', deposit: 'إيداع', withdraw: 'صرف', transfer: 'تحويل' },
    bag:           { view: 'عرض الحقيبة', use: 'استخدام غرض', transfer: 'تحويل غرض' },
    cia:           { login: 'دخول', logout: 'خروج', active: 'كشف مباشرين', fake_id: 'هوية مزيفة' },
    stock:         { buy: 'شراء', sell: 'بيع', portfolio: 'محفظتي' },
    x:             { create: 'إنشاء حساب', tweet: 'تغريدة', delete: 'حذف' },
    snap:          { create: 'إنشاء حساب' },
    snap_menu:     { send: 'إرسال سناب', inbox: 'الوارد', friends: 'أصدقائي', add: 'إضافة صديق', requests: 'طلبات الصداقة' },
    health_menu:   { hospital_resuscitation: 'إنعاش المستشفى', witch_resuscitation: 'إنعاش الساحرة', decay: 'التحلل' },
    jobs_menu:     { fishing: 'صيد السمك', woodcutting: 'قطع الأشجار', mining: 'التعدين' },
    phone_menu:    { report_police: 'بلاغ للشرطة', report_ambulance: 'بلاغ للإسعاف' },
    vehicles_menu: { view: 'سياراتي' },
    admin_menu:    { ranks: 'عرض الرتب', points: 'نقاط الإدارة', manage: 'إدارة اللاعبين', logs: 'سجل الأحداث' },
    events_menu:   { open_flight: 'فتح رحلة', hurricane: 'إعصار', alert: 'تنبيه عام', special_event: 'حدث خاص' },
    law_menu:      { new_case: 'فتح قضية', my_cases: 'قضاياي', hire_lawyer: 'توكيل محامٍ' },
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
