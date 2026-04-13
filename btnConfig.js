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
    const full = raw.match(/^<a?:(\w+):(\d+)>$/);
    if (full) return { name: full[1], id: full[2] };
    const short = raw.match(/^(\w+):(\d+)$/);
    if (short) return { name: short[1], id: short[2] };
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
};

const MENU_SYSTEMS = new Set(['snap_menu']);

const SYSTEM_LABELS = {
    bank:      'البنك',
    bag:       'الحقيبة',
    cia:       'CIA',
    stock:     'سوق الأسهم',
    x:         'منصة X',
    snap:      'سناب شات (أزرار)',
    snap_menu: 'سناب شات (منيو)',
};

const BTN_LABELS = {
    bank:      { balance: 'عرض الأموال', deposit: 'إيداع', withdraw: 'صرف', transfer: 'تحويل' },
    bag:       { view: 'عرض الحقيبة', use: 'استخدام غرض', transfer: 'تحويل غرض' },
    cia:       { login: 'دخول', logout: 'خروج', active: 'كشف مباشرين', fake_id: 'هوية مزيفة' },
    stock:     { buy: 'شراء', sell: 'بيع', portfolio: 'محفظتي' },
    x:         { create: 'إنشاء حساب', tweet: 'تغريدة', delete: 'حذف' },
    snap:      { create: 'إنشاء حساب' },
    snap_menu: { send: 'إرسال سناب', inbox: 'الوارد', friends: 'أصدقائي', add: 'إضافة صديق', requests: 'طلبات الصداقة' },
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
        try { btn.setEmoji(parseEmoji(cfg.emoji)); } catch (_) {}
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
        if (typeof parsed === 'string') {
            opt.emoji = { name: parsed };
        } else if (parsed) {
            opt.emoji = parsed;
        }
    }
    return opt;
}

module.exports = {
    DEFAULTS, MENU_SYSTEMS, SYSTEM_LABELS, BTN_LABELS,
    parseEmoji, loadSystemBtns, makeBtn, makeMenuOption,
};
