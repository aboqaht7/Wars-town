const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { DEFAULTS, MENU_SYSTEMS, SYSTEM_LABELS, BTN_LABELS } = require('../btnConfig');

const STYLE_CHOICES = [
    { name: '🔵 أزرق (Primary)',    value: 'primary'   },
    { name: '⚪ رمادي (Secondary)', value: 'secondary' },
    { name: '🟢 أخضر (Success)',    value: 'success'   },
    { name: '🔴 أحمر (Danger)',     value: 'danger'    },
];

const SYSTEM_CHOICES = Object.keys(SYSTEM_LABELS).map(k => ({
    name: SYSTEM_LABELS[k],
    value: k,
}));

module.exports = {
    name: 'تخصيص-زر',
    data: new SlashCommandBuilder()
        .setName('تخصيص-زر')
        .setDescription('خصّص نص وإيموجي ولون أي زر أو خيار منيو في البوت [أدمن فقط]')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(o => o
            .setName('نظام')
            .setDescription('اختر النظام')
            .setRequired(true)
            .addChoices(...SYSTEM_CHOICES))
        .addStringOption(o => o
            .setName('زر')
            .setDescription('اختر الزر أو خيار المنيو (سيظهر تلقائياً بعد اختيار النظام)')
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(o => o
            .setName('نص')
            .setDescription('النص الجديد')
            .setRequired(false)
            .setMaxLength(80))
        .addStringOption(o => o
            .setName('ايموجي')
            .setDescription('إيموجي عادي 💰 أو إيموجي سيرفر (اكتب اسمه مع نقطتين مثل :اسم_الايموجي:)')
            .setRequired(false))
        .addStringOption(o => o
            .setName('لون')
            .setDescription('لون الزر (للأزرار فقط، لا ينطبق على المنيو)')
            .setRequired(false)
            .addChoices(...STYLE_CHOICES))
        .addStringOption(o => o
            .setName('وصف')
            .setDescription('وصف الخيار (لخيارات المنيو فقط)')
            .setRequired(false)
            .setMaxLength(100)),

    async autocomplete(interaction) {
        const system = interaction.options.getString('نظام');
        const focused = interaction.options.getFocused().toLowerCase();
        if (!system || !BTN_LABELS[system]) return interaction.respond([]);
        const btns = BTN_LABELS[system];
        const choices = Object.entries(btns)
            .filter(([k, v]) => k.toLowerCase().includes(focused) || v.includes(focused))
            .map(([k, v]) => ({ name: v, value: k }));
        return interaction.respond(choices.slice(0, 25));
    },

    async slashExecute(interaction, db) {
        const system   = interaction.options.getString('نظام');
        const btnKey   = interaction.options.getString('زر');
        const newText  = interaction.options.getString('نص');
        const rawEmoji = interaction.options.getString('ايموجي');
        const newStyle = interaction.options.getString('لون');
        const newDesc  = interaction.options.getString('وصف');

        if (!DEFAULTS[system]) {
            return interaction.reply({ content: '❌ نظام غير معروف.', flags: 64 });
        }
        if (!DEFAULTS[system][btnKey]) {
            return interaction.reply({
                content: `❌ الزر/الخيار \`${btnKey}\` غير موجود في نظام **${SYSTEM_LABELS[system]}**.`,
                flags: 64,
            });
        }
        if (!newText && !rawEmoji && !newStyle && !newDesc) {
            return interaction.reply({ content: '❌ يجب تحديد تغيير واحد على الأقل (نص، إيموجي، لون، وصف).', flags: 64 });
        }

        const isMenu = MENU_SYSTEMS.has(system);

        let parsedEmoji = rawEmoji || null;
        if (rawEmoji) {
            const colons = rawEmoji.match(/^:(\w+):$/);
            if (colons) {
                const guildEmoji = interaction.guild?.emojis?.cache.find(e => e.name === colons[1]);
                if (guildEmoji) {
                    parsedEmoji = `<${guildEmoji.animated ? 'a' : ''}:${guildEmoji.name}:${guildEmoji.id}>`;
                }
            }
        }

        const existing = await db.getBtnCfg(system, btnKey) || { ...DEFAULTS[system][btnKey] };
        const updated = {
            label: newText     || existing.label,
            emoji: parsedEmoji || existing.emoji,
        };
        if (!isMenu) updated.style       = newStyle || existing.style;
        if (isMenu)  updated.description = newDesc  || existing.description;

        await db.setBtnCfg(system, btnKey, updated);

        const styleEmoji = { primary: '🔵', secondary: '⚪', success: '🟢', danger: '🔴' };
        const fields = [
            { name: 'النظام',    value: SYSTEM_LABELS[system] || system,          inline: true },
            { name: isMenu ? 'الخيار' : 'الزر',
                                  value: BTN_LABELS[system]?.[btnKey] || btnKey,    inline: true },
            { name: '\u200b',    value: '\u200b',                                  inline: true },
            { name: 'النص',      value: updated.label,                             inline: true },
            { name: 'الإيموجي', value: updated.emoji   || '—',                   inline: true },
        ];
        if (!isMenu) {
            fields.push({ name: 'اللون', value: `${styleEmoji[updated.style] || ''} ${updated.style}`, inline: true });
        } else {
            fields.push({ name: 'الوصف', value: updated.description || '—', inline: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('✅ تم تخصيص ' + (isMenu ? 'خيار المنيو' : 'الزر'))
            .setColor(0x00C853)
            .addFields(...fields)
            .setFooter({ text: 'التغيير يسري فوراً على أول استخدام للأمر' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed], flags: 64 });
    },
};
