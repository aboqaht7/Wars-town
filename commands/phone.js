const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, StringSelectMenuBuilder,
} = require('discord.js');
const { resetOption } = require('../utils');
const { loadSystemBtns, makeMenuOption } = require('../btnConfig');
const { loadEmbedCfg, applyEmbed } = require('../embedConfig');

async function build(db) {
    const img = await db.getImage('phone').catch(() => null);
    const cfg = await loadEmbedCfg(db, 'phone');
    const embed = new EmbedBuilder().setColor(0x1565C0).setTimestamp();
    applyEmbed(embed, cfg);
    if (img) embed.setImage(img);

    const mc = await loadSystemBtns(db, 'phone_menu');
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('phone_menu')
            .setPlaceholder(cfg.placeholder || '📱 Choose a service')
            .addOptions([
                makeMenuOption('report_police',    mc.report_police),
                makeMenuOption('report_ambulance', mc.report_ambulance),
                resetOption('phone'),
            ])
    );
    return { embeds: [embed], components: [menu] };
}

module.exports = {
    name: 'phone',
    data: new SlashCommandBuilder().setName('phone').setDescription('📱 Phone'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        message.channel.send(await build(db));
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        try { await interaction.deferReply({ flags: 64 }); } catch { return; }
        const payload = await build(db);
        if (interaction._isReset) return interaction.message.edit(payload);
        await interaction.channel.send(payload);
        await interaction.deleteReply().catch(() => {});
    },
};
