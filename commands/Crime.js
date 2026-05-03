const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow, resetOption } = require('../utils');
const { loadEmbedCfg, applyEmbed } = require('../embedConfig');

module.exports = {
    name: 'crime',
    data: new SlashCommandBuilder().setName('crime').setDescription('Robbery System'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const payload = await build(db);
        message.channel.send(payload);
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const payload = await build(db);
        if (interaction._isReset) return interaction.message.edit(payload);
        await interaction.channel.send(payload);
        await interaction.deferReply({ flags: 64 }).catch(() => {});
        await interaction.deleteReply().catch(() => {});
    }
};

async function build(db) {
    const robberies = await db.getRobberies();
    const cfg = await loadEmbedCfg(db, 'crime');
    const embed = new EmbedBuilder().setColor(0xB71C1C).setTimestamp();
    applyEmbed(embed, cfg);
    if (!robberies.length) embed.setDescription('> No robberies available right now. Wait for the admin.');
    const img = await db.getImage('crime');
    if (img) embed.setImage(img);

    if (!robberies.length) return { embeds: [embed], components: [resetRow('crime')] };

    const options = robberies.slice(0, 24).map(r => ({
        label: r.name,
        value: String(r.id),
        description: `💵 ${Number(r.min_money).toLocaleString()} — ${Number(r.max_money).toLocaleString()} Riyals`,
    }));
    options.push(resetOption('crime'));

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('robbery_menu')
            .setPlaceholder(cfg.placeholder || '⛓️ Choose a robbery')
            .addOptions(options)
    );
    return { embeds: [embed], components: [menu] };
}
