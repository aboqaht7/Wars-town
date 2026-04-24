const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database');
const { resetRow, resetOption } = require('../utils');

async function build() {
    const items = await db.getBlackMarketItems();
    const embed = new EmbedBuilder()
        .setTitle('Black Market')
        .setColor(0xB71C1C)
        .setDescription(items.length
            ? 'Choose the item you want to buy from the list.'
            : '> No items available right now. Wait for the admin.')
        .setFooter({ text: 'Black Market • FANTASY Bot' })
        .setTimestamp();

    const img = await db.getImage('بلاك ماركت');
    if (img) embed.setImage(img);

    if (!items.length) return { embeds: [embed], components: [resetRow('بلاك-ماركت')] };

    const options = items.slice(0, 24).map(it => ({
        label: it.name,
        value: String(it.id),
        description: `💰 ${Number(it.price).toLocaleString('en-US')}$`,
    }));
    options.push(resetOption('بلاك-ماركت'));

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('black_market_menu')
            .setPlaceholder('🔫 Choose an item')
            .addOptions(options)
    );
    return { embeds: [embed], components: [menu] };
}

module.exports = {
    name: 'بلاك-ماركت',
    buildPublic: build,
    data: new SlashCommandBuilder()
        .setName('بلاك-ماركت')
        .setDescription('Open the black market to buy items'),

    async slashExecute(interaction) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const payload = await build();
        if (interaction._isReset) return interaction.message.edit(payload);
        await interaction.channel.send(payload);
        return interaction.reply({ content: '​', flags: 64 });
    },

    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const payload = await build();
        return message.channel.send(payload);
    },
};
