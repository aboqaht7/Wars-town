const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow, resetOption } = require('../utils');

module.exports = {
    name: 'events',
    data: new SlashCommandBuilder()
        .setName('events')
        .setDescription('View Trips & Events'),
    async execute(message, args, db) {
        const { embed, menu } = await build(db);
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        const { embed, menu } = await build(db);
        const main = { embeds: [embed], components: [menu] };
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.reply({ content: '​', flags: 64 });
    }
};

async function build(db) {
    const embed = new EmbedBuilder()
        .setTitle('Trips & Events')
        .setColor(0x6A1B9A)
        .setDescription('Choose the event type you want to activate')
        .addFields(
            { name: '📍 Location', value: 'Contact the admin to find the event location', inline: true },
            { name: '⏰ Time', value: 'Determined by the responsible supervisor', inline: true },
        )
        .setImage(await db.getImage('events') || null)
        .setFooter({ text: 'Events System • FANTASY Bot' })
        .setTimestamp();
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('events_menu')
            .setPlaceholder('Choose event type')
            .addOptions([
                { label: '✈️ Open a Trip', value: 'open_flight' },
                { label: '🌪️ Hurricane', value: 'hurricane' },
                { label: '📣 General Alert', value: 'alert' },
                { label: '🎉 Special Event', value: 'special_event' },
            
                { label: '🔄 Reset Menu', value: 'reset_events', description: 'Return to the main view' },
            ])
    );
    return { embed, menu };
}
