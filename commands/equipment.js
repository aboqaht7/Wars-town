const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow, resetOption } = require('../utils');
const { loadEmbedCfg, applyEmbed } = require('../embedConfig');

module.exports = {
    name: 'معدات',
    data: new SlashCommandBuilder()
        .setName('معدات')
        .setDescription('🔨 Equipment Store — Buy your equipment'),

    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const payload = await buildEquipment(db);
        message.channel.send(payload);
    },

    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const payload = await buildEquipment(db);
        if (interaction._isReset) return interaction.message.edit(payload);
        await interaction.channel.send(payload);
        await interaction.deferReply({ flags: 64 }).catch(() => {});
        await interaction.deleteReply().catch(() => {});
    },

    buildEquipment,
};

async function buildEquipment(db) {
    const items = await db.getEquipmentItems();
    const img   = await db.getImage('معدات');
    const cfg   = await loadEmbedCfg(db, 'equipment');

    const embed = new EmbedBuilder().setColor(0x4527A0).setTimestamp();
    applyEmbed(embed, cfg);
    if (img) embed.setImage(img);

    if (!items.length) {
        embed.setDescription('> No equipment available right now. Wait for the admin.');
        return { embeds: [embed], components: [resetRow('معدات')] };
    }

    const options = items.slice(0, 24).map(it => ({
        label: it.name,
        value: String(it.id),
        description: `💰 ${Number(it.price).toLocaleString()} Riyals` +
            (it.description ? ` — ${it.description.slice(0, 40)}` : ''),
    }));

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('equipment_item_select')
            .setPlaceholder(cfg.placeholder || '🔨 Choose equipment')
            .addOptions([...options, resetOption('معدات')])
    );

    return { embeds: [embed], components: [menu] };
}
