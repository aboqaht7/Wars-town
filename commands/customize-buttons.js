const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { DEFAULTS, SYSTEM_LABELS, BTN_LABELS } = require('../btnConfig');

const STYLE_CHOICES = [
    { name: '🔵 أزرق (Primary)',  value: 'primary'   },
    { name: '⚪ رمادي (Secondary)', value: 'secondary' },
    { name: '🟢 أخضر (Success)',  value: 'success'   },
    { name: '🔴 أحمر (Danger)',   value: 'danger'    },
];

const SYSTEM_CHOICES = Object.keys(SYSTEM_LABELS).map(k => ({
    name: SYSTEM_LABELS[k],
    value: k,
}));

module.exports = {
    name: 'تخصيص-زر',
    data: new SlashCommandBuilder()
        .setName('تخصيص-زر')
        .setDescription('خصّص نص وإيموجي ولون أي زر في البوت [أدمن فقط]')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(o => o
            .setName('نظام')
            .setDescription('اختر النظام')
            .setRequired(true)
            .addChoices(...SYSTEM_CHOICES))
        .addStringOption(o => o
            .setName('زر')
            .setDescription('اختر الزر (سيظهر بعد اختيار النظام)')
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(o => o
            .setName('نص')
            .setDescription('النص الجديد للزر (اتركه فارغاً للإبقاء على الحالي)')
            .setRequired(false)
            .setMaxLength(80))
        .addStringOption(o => o
            .setName('ايموجي')
            .setDescription('الإيموجي الجديد (Unicode أو ID إيموجي مخصص، اتركه فارغاً للإبقاء)')
            .setRequired(false))
        .addStringOption(o => o
            .setName('لون')
            .setDescription('لون الزر')
            .setRequired(false)
            .addChoices(...STYLE_CHOICES)),

    async autocomplete(interaction) {
        const system = interaction.options.getString('نظام');
        const focused = interaction.options.getFocused();
        if (!system || !BTN_LABELS[system]) return interaction.respond([]);
        const btns = BTN_LABELS[system];
        const choices = Object.entries(btns)
            .filter(([k, v]) => k.includes(focused) || v.includes(focused))
            .map(([k, v]) => ({ name: v, value: k }));
        return interaction.respond(choices.slice(0, 25));
    },

    async slashExecute(interaction, db) {
        const system  = interaction.options.getString('نظام');
        const btnKey  = interaction.options.getString('زر');
        const newText = interaction.options.getString('نص');
        const newEmoji = interaction.options.getString('ايموجي');
        const newStyle = interaction.options.getString('لون');

        if (!DEFAULTS[system]) {
            return interaction.reply({ content: '❌ نظام غير معروف.', flags: 64 });
        }
        if (!DEFAULTS[system][btnKey]) {
            return interaction.reply({ content: `❌ الزر \`${btnKey}\` غير موجود في نظام **${SYSTEM_LABELS[system]}**.`, flags: 64 });
        }

        if (!newText && !newEmoji && !newStyle) {
            return interaction.reply({ content: '❌ يجب تحديد نص أو إيموجي أو لون جديد على الأقل.', flags: 64 });
        }

        const existing = await db.getBtnCfg(system, btnKey) || { ...DEFAULTS[system][btnKey] };
        const updated = {
            label: newText  || existing.label,
            emoji: newEmoji || existing.emoji,
            style: newStyle || existing.style,
        };

        await db.setBtnCfg(system, btnKey, updated);

        const styleEmoji = { primary: '🔵', secondary: '⚪', success: '🟢', danger: '🔴' };
        const embed = new EmbedBuilder()
            .setTitle('✅ تم تخصيص الزر')
            .setColor(0x00C853)
            .addFields(
                { name: 'النظام', value: SYSTEM_LABELS[system] || system, inline: true },
                { name: 'الزر',   value: BTN_LABELS[system]?.[btnKey] || btnKey, inline: true },
                { name: '\u200b', value: '\u200b', inline: true },
                { name: 'النص',   value: updated.label, inline: true },
                { name: 'الإيموجي', value: updated.emoji || '—', inline: true },
                { name: 'اللون',   value: `${styleEmoji[updated.style] || ''} ${updated.style}`, inline: true },
            )
            .setFooter({ text: 'التغيير يسري على أول استخدام للأمر بعد هذه الرسالة' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed], flags: 64 });
    },
};
