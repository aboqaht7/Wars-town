const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'market',
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('🛒 المتجر — اشترِ ما تحتاجه'),

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
        .setTitle('🛒 المتجر')
        .setColor(0xBF360C)
        .setDescription(items.length
            ? 'اختر الغرض الذي تريد شراءه من القائمة.'
            : '> لا توجد أغراض متاحة حالياً. انتظر الإدارة.')
        .setFooter({ text: 'نظام المتجر • بوت FANTASY' })
        .setTimestamp();
    if (img) embed.setImage(img);

    if (!items.length) return { embeds: [embed], components: [resetRow('market')] };

    const options = items.slice(0, 25).map(it => ({
        label: it.name,
        value: String(it.id),
        description: `💰 ${Number(it.price).toLocaleString()} ريال` + (it.description ? ` — ${it.description.slice(0, 50)}` : ''),
    }));

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('market_item_select')
            .setPlaceholder('🛒 اختر غرضاً')
            .addOptions(options)
    );

    return { embeds: [embed], components: [menu, resetRow('market')] };
}
