const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'سيارات',
    data: new SlashCommandBuilder().setName('سيارات').setDescription('عرض سياراتك المسجلة'),
    async execute(message, args, db) {
        const img = await db.getImage('vehicles');
        message.channel.send(build(img));
    },
    async slashExecute(interaction, db) {
        const img = await db.getImage('vehicles');
        const main = build(img);
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.reply({ content: '​', flags: 64 });
    }
};

function build(image) {
    const embed = new EmbedBuilder()
        .setTitle('🚗 سياراتي المسجلة')
        .setColor(0x37474F)
        .setDescription('اعرض سياراتك المسجلة في نظام FANTASY.')
        .setFooter({ text: 'نظام السيارات • بوت FANTASY' })
        .setTimestamp();
    if (image) embed.setImage(image);
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('vehicles_menu')
            .setPlaceholder('اختر خيار')
            .addOptions([
                { label: '🚗 عرض سياراتي', value: 'view' },
            ])
    );
    return { embeds: [embed], components: [menu, resetRow('vehicles')] };
}
