const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { resetRow, resetOption } = require('../utils');

module.exports = {
    name: 'market',
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('🛒 Store — Buy what you need'),

    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const payload = await buildMarket(db);
        message.channel.send(payload);
    },

    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const payload = await buildMarket(db);
        if (interaction._isReset) return interaction.message.edit(payload);
        await interaction.channel.send(payload);
        await interaction.reply({ content: '​', flags: 64 });
    },

    buildMarket,
};

async function buildMarket(db) {
    const items = await db.getMarketItems();
    const img   = await db.getImage('market');

    const embed = new EmbedBuilder()
        .setTitle('Store')
        .setColor(0xBF360C)
        .setDescription(items.length
            ? 'Choose the item you want to buy from the list.'
            : '> No items available right now. Wait for the admin.')
        .setFooter({ text: 'Store System • FANTASY Bot' })
        .setTimestamp();
    if (img) embed.setImage(img);

    if (!items.length) return { embeds: [embed], components: [resetRow('market')] };

    const options = items.slice(0, 24).map(it => ({
        label: it.name,
        value: String(it.id),
        description: `💰 ${Number(it.price).toLocaleString()} ريال` + (it.description ? ` — ${it.description.slice(0, 50)}` : ''),
    }));
    options.push(resetOption('market'));

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('market_item_select')
            .setPlaceholder('🛒 Choose an item')
            .addOptions(options)
    );

    return { embeds: [embed], components: [menu] };
}
