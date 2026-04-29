const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetOption } = require('../utils');
const { loadSystemBtns, makeMenuOption } = require('../btnConfig');

async function build(db) {
    const img = await db.getImage('vehicles').catch(() => null);
    const embed = new EmbedBuilder()
        .setTitle('My Registered Cars')
        .setColor(0x37474F)
        .setDescription('View your registered cars in the FANTASY system.')
        .setFooter({ text: 'Vehicles System • FANTASY Bot' })
        .setTimestamp();
    if (img) embed.setImage(img);

    const mc = await loadSystemBtns(db, 'vehicles_menu');
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('vehicles_menu')
            .setPlaceholder('Choose an option')
            .addOptions([
                makeMenuOption('view', mc.view),
                resetOption('vehicles'),
            ])
    );
    return { embeds: [embed], components: [menu] };
}

module.exports = {
    name: 'سيارات',
    data: new SlashCommandBuilder().setName('سيارات').setDescription('View your registered cars'),
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
