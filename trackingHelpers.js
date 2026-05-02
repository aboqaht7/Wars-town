const ARABIC_WORDS = [
    'مجتهد','شجاعه','ابداع','سلامه','مكتبه','مدرسه','جامعه','مهندس',
    'محترف','رياضه','ثقافه','عبقري','حضاره','تطوير','تحقيق','مستقبل',
    'تعاون','اخلاص','كرامه','امانه','عداله','نظام','قانون','محكمه',
    'شركه','مشروع','تخطيط','انتاج','تسويق','مزرعه','حقيقه','دراسه',
    'مستشفى','صيدليه','نجوم','زهره','شجره','طائر','فضه','ياقوت',
    'زمرد','لؤلؤ','وزير','قائد','حكيم','كريم','نبيل','عظيم',
    'جميل','سعيد','نشيط','ذكي','مبدع','رائع','بارع','ماهر',
    'صادق','وفي','شريف','محبوب','فخور','قدير','بارز','متفوق',
];

function pickCodeWord() {
    return ARABIC_WORDS[Math.floor(Math.random() * ARABIC_WORDS.length)];
}

function formatSpaced(word) {
    return Array.from(word).join(' ');
}

function normalizeArabic(str) {
    if (!str) return '';
    return String(str)
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/ـ/g, '')
        .replace(/[إأآا]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/\s+/g, '')
        .trim()
        .toLowerCase();
}

function matchesCode(input, codeWord) {
    return normalizeArabic(input) === normalizeArabic(codeWord);
}

function formatRemaining(ms) {
    if (ms <= 0) return '0 ثانية';
    const totalSec = Math.ceil(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const parts = [];
    if (h) parts.push(`${h} ساعة`);
    if (m) parts.push(`${m} دقيقة`);
    if (s && !h) parts.push(`${s} ثانية`);
    return parts.join(' و ') || `${s} ثانية`;
}

const TRACKING_COOLDOWN_MS = 2 * 60 * 60 * 1000;
const PRESIDENT_MONTHLY_LIMIT = 2;
const TRACKING_TIMEOUT_MS = 20_000;

module.exports = {
    ARABIC_WORDS,
    pickCodeWord,
    formatSpaced,
    normalizeArabic,
    matchesCode,
    formatRemaining,
    TRACKING_COOLDOWN_MS,
    PRESIDENT_MONTHLY_LIMIT,
    TRACKING_TIMEOUT_MS,
};
