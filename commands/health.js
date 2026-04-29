const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetOption } = require('../utils');
const { loadSystemBtns, makeMenuOption } = require('../btnConfig');

async function build(db) {
    const embed = new EmbedBuilder()
        .setTitle('Ministry of Health')
        .setColor(0x1B5E20)
        .setDescription('Choose the medical service you need.')
        .setFooter({ text: 'Health System • FANTASY Bot' })
        .setTimestamp();
    const img = await db.getImage('health').catch(() => null);
    if (img) embed.setImage(img);

    const mc = await loadSystemBtns(db, 'health_menu');
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('health_menu')
            .setPlaceholder('🏥 Choose a medical service')
            .addOptions([
                makeMenuOption('hospital_resuscitation', mc.hospital_resuscitation),
                makeMenuOption('witch_resuscitation',    mc.witch_resuscitation),
                makeMenuOption('decay',                  mc.decay),
                resetOption('health'),
            ])
    );
    return { embeds: [embed], components: [menu] };
}

module.exports = {
    name: 'health',
    data: new SlashCommandBuilder().setName('health').setDescription('Ministry of Health System'),
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
    build,
};
