const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow, resetOption } = require('../utils');

const RESOURCES = ['ألمنيوم', 'حديد', 'خشب', 'أربطة', 'مسامير'];

const WEAPONS = [
    { value: 'craft_sns',     label: '🔫 Pistol SNS',     description: 'Requires 200 of each resource', req: 200 },
    { value: 'craft_vintage', label: '🔫 Pistol Vintage',  description: 'Requires 300 of each resource', req: 300 },
    { value: 'craft_mkii',    label: '🔫 Pistol MK II',    description: 'Requires 500 of each resource', req: 500 },
];

function buildEmbed() {
    return new EmbedBuilder()
        .setTitle('Manufacturing System')
        .setDescription('Choose the pistol you want to craft from the list below.')
        .setColor(0xE53935)
        .setFooter({ text: 'Manufacturing System • FANTASY Bot' });
}

function buildRow() {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('craft_weapon')
            .setPlaceholder('🔫 Choose a pistol...')
            .addOptions([
                ...WEAPONS.map(w => ({
                    label: w.label,
                    description: w.description,
                    value: w.value,
                })),
                resetOption('تصنيع'),
            ])
    );
}

module.exports = {
    name: 'تصنيع',
    data: new SlashCommandBuilder()
        .setName('تصنيع')
        .setDescription('Craft pistols from gathered resources'),

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
    WEAPONS,
    buildEmbed,
    buildRow,
};
