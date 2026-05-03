const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetOption } = require('../utils');
const { loadSystemBtns, makeMenuOption } = require('../btnConfig');
const { loadEmbedCfg, applyEmbed } = require('../embedConfig');

async function build(db) {
    const cfg = await loadEmbedCfg(db, 'flight');
    const embed = new EmbedBuilder().setColor(0xE53935).setTimestamp()
        .addFields(
            { name: '📍 Location', value: 'Contact the admin to find the event location', inline: true },
            { name: '⏰ Time', value: 'Determined by the responsible supervisor', inline: true },
        )
        .setImage(await db.getImage('events').catch(() => null) || null);
    applyEmbed(embed, cfg);

    const mc = await loadSystemBtns(db, 'events_menu');
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('events_menu')
            .setPlaceholder(cfg.placeholder || 'Choose event type')
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
