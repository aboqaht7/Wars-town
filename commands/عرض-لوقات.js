const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { LOG_TYPES } = require('../loggers');

module.exports = {
    name: 'عرض-لوقات',
    data: new SlashCommandBuilder()
        .setName('عرض-لوقات')
        .setDescription('عرض جميع رومات اللوقات المعيّنة حالياً')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async slashExecute(interaction, db) {
        const lines = [];
        for (const [type, meta] of Object.entries(LOG_TYPES)) {
            const id = await db.getConfig(meta.key).catch(() => null);
            lines.push(`**${meta.label}** — ${id ? `<#${id}>` : '_غير معيّن_'}`);
        }

        const embed = new EmbedBuilder()
            .setTitle('رومات اللوقات الحالية')
            .setColor(0xE53935)
            .setDescription(lines.join('\n'))
            .setFooter({ text: 'نظام اللوقات • FANTASY Bot' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};
