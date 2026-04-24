const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow, resetOption } = require('../utils');

module.exports = {
    name: 'سيارات',
    data: new SlashCommandBuilder().setName('سيارات').setDescription('View your registered cars'),
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
        .setTitle('My Registered Cars')
        .setColor(0x37474F)
        .setDescription('View your registered cars in the FANTASY system.')
        .setFooter({ text: 'Vehicles System • FANTASY Bot' })
        .setTimestamp();
    if (image) embed.setImage(image);
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('vehicles_menu')
            .setPlaceholder('Choose an option')
            .addOptions([
                { label: '🚗 View My Cars', value: 'view' },
            
                { label: '🔄 Reset Menu', value: 'reset_vehicles', description: 'Return to the main view' },
            ])
    );
    return { embeds: [embed], components: [menu] };
}
