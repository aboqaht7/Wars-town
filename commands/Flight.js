const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetOption } = require('../utils');
const { loadSystemBtns, makeMenuOption } = require('../btnConfig');

async function build(db) {
    const embed = new EmbedBuilder()
        .setTitle('Trips & Events')
        .setColor(0x6A1B9A)
        .setDescription('اختر نوع الحدث الذي تريد تفعيله')
        .addFields(
            { name: '📍 الموقع', value: 'تواصل مع الأدمن لمعرفة موقع الحدث', inline: true },
            { name: '⏰ الوقت', value: 'يحدده المشرف المسؤول', inline: true },
        )
        .setImage(await db.getImage('events').catch(() => null) || null)
        .setFooter({ text: 'Events System • FANTASY Bot' })
        .setTimestamp();

    const mc = await loadSystemBtns(db, 'events_menu');
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('events_menu')
            .setPlaceholder('اختر نوع الحدث')
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
        const payload = await build(db);
        if (interaction._isReset) return interaction.message.edit(payload);
        await interaction.channel.send(payload);
        await interaction.reply({ content: '​', flags: 64 });
    },
};
