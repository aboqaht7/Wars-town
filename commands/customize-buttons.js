const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { DEFAULTS, MENU_SYSTEMS, SYSTEM_LABELS, BTN_LABELS } = require('../btnConfig');

const STYLE_CHOICES = [
    { name: '🔵 Blue (Primary)',   value: 'primary'   },
    { name: '⚪ Grey (Secondary)', value: 'secondary' },
    { name: '🟢 Green (Success)',  value: 'success'   },
    { name: '🔴 Red (Danger)',     value: 'danger'    },
];

const SYSTEM_CHOICES = Object.keys(SYSTEM_LABELS).map(k => ({
    name: SYSTEM_LABELS[k],
    value: k,
}));

async function resolveEmoji(rawEmoji, guild) {
    if (!rawEmoji) return null;

    const fullMatch = rawEmoji.match(/^<(a?):(\w+):(\d+)>$/);
    if (fullMatch) return rawEmoji;

    const nameOnly = rawEmoji.replace(/^:|:$/g, '').trim();
    if (nameOnly && guild) {
        try {
            const emojis = await guild.emojis.fetch();
            const found = emojis.find(e => e.name === nameOnly);
            if (found) {
                return `<${found.animated ? 'a' : ''}:${found.name}:${found.id}>`;
            }
        } catch (_) {}
    }

    return rawEmoji;
}

module.exports = {
    name: 'تخصيص-زر',
    data: new SlashCommandBuilder()
        .setName('تخصيص-زر')
        .setDescription('Customize label, emoji, and color of any bot button or menu option [Admin only]')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(o => o
            .setName('نظام')
            .setDescription('Choose the system')
            .setRequired(true)
            .addChoices(...SYSTEM_CHOICES))
        .addStringOption(o => o
            .setName('زر')
            .setDescription('Choose the button or menu option')
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(o => o
            .setName('نص')
            .setDescription('New button label')
            .setRequired(false)
            .setMaxLength(80))
        .addStringOption(o => o
            .setName('ايموجي')
            .setDescription('Type : then the emoji name and select from dropdown — or paste <:name:ID> directly')
            .setRequired(false))
        .addStringOption(o => o
            .setName('لون')
            .setDescription('Button color (buttons only)')
            .setRequired(false)
            .addChoices(...STYLE_CHOICES))
        .addStringOption(o => o
            .setName('وصف')
            .setDescription('Option description (menu options only)')
            .setRequired(false)
            .setMaxLength(100)),

    async autocomplete(interaction) {
        const system = interaction.options.getString('نظام');
        const focused = interaction.options.getFocused().toLowerCase();
        if (!system || !BTN_LABELS[system]) return interaction.respond([]);
        const choices = Object.entries(BTN_LABELS[system])
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
            return interaction.reply({ content: '❌ Unknown system.', flags: 64 });
        }
        if (!DEFAULTS[system][btnKey]) {
            return interaction.reply({
                content: `❌ Button/option \`${btnKey}\` not found in **${SYSTEM_LABELS[system]}** system.`,
                flags: 64,
            });
        }
        if (!newText && !rawEmoji && !newStyle && !newDesc) {
            return interaction.reply({ content: '❌ At least one change must be specified.', flags: 64 });
        }

        const isMenu = MENU_SYSTEMS.has(system);

        const resolvedEmoji = rawEmoji
            ? await resolveEmoji(rawEmoji, interaction.guild)
            : null;

        const existing = await db.getBtnCfg(system, btnKey) || { ...DEFAULTS[system][btnKey] };
        const updated = {
            label: newText         || existing.label,
            emoji: resolvedEmoji   || existing.emoji,
        };
        if (!isMenu) updated.style       = newStyle || existing.style;
        if (isMenu)  updated.description = newDesc  || existing.description;

        await db.setBtnCfg(system, btnKey, updated);

        const isCustomEmoji = updated.emoji?.match(/^<a?:\w+:\d+>$/);
        const emojiDisplay  = isCustomEmoji ? updated.emoji : (updated.emoji || '—');
        const styleEmoji    = { primary: '🔵', secondary: '⚪', success: '🟢', danger: '🔴' };

        const fields = [
            { name: 'System',                    value: SYSTEM_LABELS[system] || system,        inline: true },
            { name: isMenu ? 'Option' : 'Button', value: BTN_LABELS[system]?.[btnKey] || btnKey, inline: true },
            { name: '\u200b',                    value: '\u200b',                               inline: true },
            { name: 'Label',                     value: updated.label,                          inline: true },
            { name: 'Emoji',                     value: emojiDisplay,                           inline: true },
        ];
        if (!isMenu) {
            fields.push({ name: 'Color', value: `${styleEmoji[updated.style] || ''} ${updated.style}`, inline: true });
        } else {
            fields.push({ name: 'Description', value: updated.description || '—', inline: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('✅ ' + (isMenu ? 'Menu Option Updated' : 'Button Updated'))
            .setColor(0xE53935)
            .addFields(...fields)
            .setFooter({ text: 'Changes take effect immediately on next command use' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed], flags: 64 });
    },
};
