const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetOption } = require('../utils');
const { loadSystemBtns, makeMenuOption } = require('../btnConfig');
const { loadEmbedCfg, applyEmbed } = require('../embedConfig');

async function build(db) {
    const cfg = await loadEmbedCfg(db, 'admin');
    const embed = new EmbedBuilder().setColor(0xF9A825).setTimestamp();
    applyEmbed(embed, cfg);
    const img = await db.getImage('admin').catch(() => null);
    if (img) embed.setImage(img);

    const mc = await loadSystemBtns(db, 'admin_menu');
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('admin_menu')
            .setPlaceholder(cfg.placeholder || 'Choose an option')
            .addOptions([
                makeMenuOption('ranks',  mc.ranks),
                makeMenuOption('points', mc.points),
                makeMenuOption('manage', mc.manage),
                makeMenuOption('logs',   mc.logs),
                resetOption('admin'),
            ])
    );
    return { embeds: [embed], components: [menu] };
}

module.exports = {
    name: 'admin',
    data: new SlashCommandBuilder().setName('admin').setDescription('Admin System & Admin Points'),
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
