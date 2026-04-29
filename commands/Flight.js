const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetOption } = require('../utils');
const { loadSystemBtns, makeMenuOption } = require('../btnConfig');

async function build(db) {
    const embed = new EmbedBuilder()
        .setTitle('Trips & Events')
        .setColor(0x6A1B9A)
        .setDescription('Choose the event type you want to activate')
        .addFields(
            { name: '📍 Location', value: 'Contact the admin to find the event location', inline: true },
            { name: '⏰ Time', value: 'Determined by the responsible supervisor', inline: true },
        )
        .setImage(await db.getImage('events').catch(() => null) || null)
        .setFooter({ text: 'Events System • FANTASY Bot' })
        .setTimestamp();

    const mc = await loadSystemBtns(db, 'events_menu');
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('events_menu')
            .setPlaceholder('Choose event type')
            .addOptions([
                makeMenuOption('open_flight',   mc.open_flight),
                makeMenuOption('hurricane',     mc.hurricane),
                makeMenuOption('alert',         mc.alert),
                makeMenuOption('special_event', mc.special_event),
                resetOption('events'),
            ])
    );
    return { embeds: [embed], components: [menu] };
}

module.exports = {
    name: 'events',
    data: new SlashCommandBuilder()
        .setName('events')
        .setDescription('View Trips & Events'),
    async execute(message, args, db) {
        message.channel.send(await build(db));
    },
    async slashExecute(interaction, db) {
        try { await interaction.deferReply({ flags: 64 }); } catch { return; }
        const payload = await build(db);
        if (interaction._isReset) return interaction.message.edit(payload);
        await interaction.channel.send(payload);
        await interaction.deleteReply().catch(() => {});
    },
};
