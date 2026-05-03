const {
    SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType,
} = require('discord.js');
const { EMBED_DEFAULTS, EMBED_LABELS, FIELD_LABELS } = require('../embedConfig');

const COLOR_CHOICES = [
    { name: '🔵 أزرق',     value: '1565C0' },
    { name: '🔴 أحمر',     value: 'E53935' },
    { name: '🟢 أخضر',     value: '43A047' },
    { name: '🟡 أصفر',     value: 'FBC02D' },
    { name: '🟣 أرجواني', value: '6A1B9A' },
    { name: '⚫ أسود',     value: '0D1B2A' },
    { name: '⚪ رمادي',    value: '607D8B' },
];

const EMBED_CHOICES = Object.keys(EMBED_LABELS).map(k => ({
    name: EMBED_LABELS[k],
    value: k,
}));

module.exports = {
    name: 'تخصيص-كلام-امبد',
    data: new SlashCommandBuilder()
        .setName('تخصيص-كلام-امبد')
        .setDescription('تخصيص نصوص الامبدات في البوت أو إرسال امبد مخصص لقناة [للأدمن]')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(s => s
            .setName('تعديل')
            .setDescription('تعديل نص في امبد موجود في البوت')
            .addStringOption(o => o.setName('امبد').setDescription('اختر الامبد').setRequired(true).addChoices(...EMBED_CHOICES))
            .addStringOption(o => o.setName('حقل').setDescription('الحقل (عنوان/وصف/تذييل/سيلكت منيو)').setRequired(true).setAutocomplete(true))
            .addStringOption(o => o.setName('نص').setDescription('النص الجديد').setRequired(true).setMaxLength(2000)))
        .addSubcommand(s => s
            .setName('ارجاع')
            .setDescription('إرجاع حقل لقيمته الافتراضية')
            .addStringOption(o => o.setName('امبد').setDescription('اختر الامبد').setRequired(true).addChoices(...EMBED_CHOICES))
            .addStringOption(o => o.setName('حقل').setDescription('الحقل').setRequired(true).setAutocomplete(true)))
        .addSubcommand(s => s
            .setName('ارسال')
            .setDescription('إرسال امبد مخصص (خارجي) لقناة')
            .addChannelOption(o => o.setName('قناة').setDescription('القناة').addChannelTypes(ChannelType.GuildText).setRequired(true))
            .addStringOption(o => o.setName('عنوان').setDescription('عنوان الامبد').setRequired(false).setMaxLength(256))
            .addStringOption(o => o.setName('وصف').setDescription('وصف الامبد').setRequired(false).setMaxLength(4000))
            .addStringOption(o => o.setName('تذييل').setDescription('تذييل الامبد').setRequired(false).setMaxLength(2048))
            .addStringOption(o => o.setName('لون').setDescription('لون الامبد').setRequired(false).addChoices(...COLOR_CHOICES))
            .addStringOption(o => o.setName('صورة').setDescription('رابط صورة (اختياري)').setRequired(false)))
        .addSubcommand(s => s
            .setName('عرض')
            .setDescription('عرض جميع التخصيصات الحالية')),

    async autocomplete(interaction) {
        const embedKey = interaction.options.getString('امبد');
        const focused  = interaction.options.getFocused().toLowerCase();
        if (!embedKey || !EMBED_DEFAULTS[embedKey]) return interaction.respond([]);
        const fields = Object.keys(EMBED_DEFAULTS[embedKey]);
        const choices = fields
            .filter(f => f.toLowerCase().includes(focused) || (FIELD_LABELS[f] || '').includes(focused))
            .map(f => ({ name: FIELD_LABELS[f] || f, value: f }));
        return interaction.respond(choices.slice(0, 25));
    },

    async slashExecute(interaction, db) {
        const sub = interaction.options.getSubcommand();

        // ── تعديل ──────────────────────────────────────────────────────
        if (sub === 'تعديل') {
            const key   = interaction.options.getString('امبد');
            const field = interaction.options.getString('حقل');
            const value = interaction.options.getString('نص');
            if (!EMBED_DEFAULTS[key]) {
                return interaction.reply({ content: '❌ امبد غير معروف.', flags: 64 });
            }
            if (!(field in EMBED_DEFAULTS[key])) {
                return interaction.reply({
                    content: `❌ الحقل \`${field}\` غير متاح في **${EMBED_LABELS[key]}**.`,
                    flags: 64,
                });
            }
            await db.setEmbedCfg(key, field, value);
            return interaction.reply({
                content: `✅ تم تعديل **${FIELD_LABELS[field] || field}** في **${EMBED_LABELS[key]}**.\n📝 سيظهر التغيير عند تشغيل الأمر/اللوحة من جديد.`,
                flags: 64,
            });
        }

        // ── ارجاع ──────────────────────────────────────────────────────
        if (sub === 'ارجاع') {
            const key   = interaction.options.getString('امبد');
            const field = interaction.options.getString('حقل');
            if (!EMBED_DEFAULTS[key] || !(field in (EMBED_DEFAULTS[key] || {}))) {
                return interaction.reply({ content: '❌ امبد أو حقل غير معروف.', flags: 64 });
            }
            await db.clearEmbedCfg(key, field);
            return interaction.reply({
                content: `↩️ تم إرجاع **${FIELD_LABELS[field] || field}** في **${EMBED_LABELS[key]}** للقيمة الافتراضية.`,
                flags: 64,
            });
        }

        // ── ارسال (امبد خارجي مخصص) ─────────────────────────────────────
        if (sub === 'ارسال') {
            const channel  = interaction.options.getChannel('قناة');
            const title    = interaction.options.getString('عنوان');
            const desc     = interaction.options.getString('وصف');
            const footer   = interaction.options.getString('تذييل');
            const colorRaw = interaction.options.getString('لون');
            const image    = interaction.options.getString('صورة');

            if (!title && !desc) {
                return interaction.reply({ content: '❌ يجب توفير عنوان أو وصف على الأقل.', flags: 64 });
            }

            const embed = new EmbedBuilder().setTimestamp();
            if (title)  embed.setTitle(title);
            if (desc)   embed.setDescription(desc);
            if (footer) embed.setFooter({ text: footer });
            if (colorRaw) {
                const n = parseInt(colorRaw, 16);
                if (!isNaN(n)) embed.setColor(n);
            } else {
                embed.setColor(0x1565C0);
            }
            if (image) {
                try { embed.setImage(image); } catch (_) {}
            }

            try {
                await channel.send({ embeds: [embed] });
                return interaction.reply({ content: `✅ تم إرسال الامبد إلى ${channel}.`, flags: 64 });
            } catch (e) {
                return interaction.reply({ content: `❌ فشل الإرسال: ${e.message}`, flags: 64 });
            }
        }

        // ── عرض ────────────────────────────────────────────────────────
        if (sub === 'عرض') {
            const all = await db.getAllEmbedCfgs();
            if (!all.length) {
                return interaction.reply({ content: 'ℹ️ لا توجد تخصيصات حالياً — كل الامبدات تستخدم القيم الافتراضية.', flags: 64 });
            }
            const grouped = {};
            for (const r of all) {
                if (!grouped[r.key]) grouped[r.key] = [];
                grouped[r.key].push(r);
            }
            const lines = [];
            for (const [k, rows] of Object.entries(grouped)) {
                lines.push(`\n**🔸 ${EMBED_LABELS[k] || k}**`);
                for (const r of rows) {
                    const v = (r.value || '').replace(/\n/g, ' ').slice(0, 100);
                    lines.push(`  • ${FIELD_LABELS[r.field] || r.field}: \`${v}\``);
                }
            }
            const embed = new EmbedBuilder()
                .setTitle('📋 التخصيصات الحالية للامبدات')
                .setDescription(lines.join('\n').slice(0, 4000))
                .setColor(0x1565C0)
                .setTimestamp();
            return interaction.reply({ embeds: [embed], flags: 64 });
        }
    },
};
