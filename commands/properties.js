const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow, resetOption } = require('../utils');
const { loadEmbedCfg, applyEmbed } = require('../embedConfig');

module.exports = {
    name: 'properties',
    data: new SlashCommandBuilder().setName('properties').setDescription('View available properties for purchase'),

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
    const props = await db.getProperties();
    const cfg = await loadEmbedCfg(db, 'properties');
    const embed = new EmbedBuilder().setColor(0xE53935).setTimestamp();
    applyEmbed(embed, cfg);
    if (!props.length) embed.setDescription('> No properties available right now. Wait for the admin.');
    const img = await db.getImage('properties');
    if (img) embed.setImage(img);

    if (!props.length) return { embeds: [embed], components: [resetRow('properties')] };

    const options = props.slice(0, 24).map(p => ({
        label: p.name,
        value: String(p.id),
        description: `💰 ${Number(p.price).toLocaleString()} Riyals`,
    }));

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('properties_menu')
            .setPlaceholder(cfg.placeholder || '🏠 Choose a property')
            .addOptions([...options, resetOption('properties')])
    );
    return { embeds: [embed], components: [menu] };
}
