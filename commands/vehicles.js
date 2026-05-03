const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetOption } = require('../utils');
const { loadSystemBtns, makeMenuOption } = require('../btnConfig');
const { loadEmbedCfg, applyEmbed } = require('../embedConfig');

async function build(db) {
    const img = await db.getImage('vehicles').catch(() => null);
    const cfg = await loadEmbedCfg(db, 'vehicles');
    const embed = new EmbedBuilder().setColor(0x37474F).setTimestamp();
    applyEmbed(embed, cfg);
    if (img) embed.setImage(img);

    const mc = await loadSystemBtns(db, 'vehicles_menu');
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('vehicles_menu')
            .setPlaceholder(cfg.placeholder || 'Choose an option')
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
