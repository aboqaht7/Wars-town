const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { resetRow } = require('../utils');

const RESOURCES = [
    { name: 'ألمنيوم', emoji: '🔩' },
    { name: 'حديد',    emoji: '⚙️' },
    { name: 'خشب',     emoji: '🪵' },
    { name: 'أربطة',   emoji: '🪢' },
    { name: 'مسامير',  emoji: '📌' },
];

function buildEmbed() {
    return new EmbedBuilder()
        .setTitle('Crafting System')
        .setDescription('Press the button below to gather random resources added directly to your bag.')
        .setColor(0x2ecc71)
        .setFooter({ text: 'Crafting System • FANTASY Bot' });
}

function buildRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gather_resources')
            .setLabel('🪛 Gather Resources')
            .setStyle(ButtonStyle.Success)
    );
}

module.exports = {
    name: 'تجميع',
    data: new SlashCommandBuilder()
        .setName('تجميع')
        .setDescription('Gather random resources for crafting'),

    async slashExecute(interaction, db) {
        const identity = await db.getActiveIdentity(interaction.user.id);
        if (!identity) return interaction.reply({ content: 'You are not logged in. Please log in first.', flags: 64 });

        const payload = { embeds: [buildEmbed()], components: [buildRow()] };
        if (interaction._isReset) {
            return interaction.message.edit(payload);
        }
        await interaction.reply({ content: '\u200b', flags: 65 });
        await interaction.channel.send(payload);
    },

    RESOURCES,
    buildEmbed,
    buildRow,
};
