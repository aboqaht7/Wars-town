const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow, resetOption } = require('../utils');

module.exports = {
    name: 'سوق-مركزي',
    data: new SlashCommandBuilder().setName('سوق-مركزي').setDescription('🏪 Central Market — Sell fish, wood and metals'),

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
    const prices = await db.getJobPrices();
    const img    = await db.getImage('سوق-مركزي');

    const fmt = (name) => `${(prices[name] || 0).toLocaleString()} Riyals`;

    const embed = new EmbedBuilder()
        .setTitle('Central Market')
        .setColor(0x00796B)
        .setDescription('> Choose the category you want to sell from the menu\n> Prices refresh automatically every hour\n\u200B')
        .addFields(
            {
                name: '🎣 Fish',
                value: [
                    `🐟 Shrimp — **${fmt('روبيان')}**`,
                    `🐟 Salmon — **${fmt('سالمون')}**`,
                    `🐟 Grouper — **${fmt('سمك هامور')}**`,
                    `🐳 Whale — **${fmt('حوت')}**`,
                ].join('\n'),
                inline: true,
            },
            {
                name: '🪓 Wood',
                value: `🪵 Timber — **${fmt('خشب')}**`,
                inline: true,
            },
            {
                name: '⛏️ Metals',
                value: [
                    `🟤 Copper — **${fmt('نحاس')}**`,
                    `⚪ Silver — **${fmt('فضة')}**`,
                    `🟡 Gold — **${fmt('ذهب')}**`,
                    `💎 Diamond — **${fmt('الماس')}**`,
                ].join('\n'),
                inline: true,
            },
        )
        .setFooter({ text: 'Central Market • FANTASY Bot' })
        .setTimestamp();

    if (img) embed.setImage(img);

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('central_market_sell')
            .setPlaceholder('🏪 Choose what to sell')
            .addOptions([
                { label: '🎣 Sell All Fish',    value: 'fishing',     description: 'Shrimp • Salmon • Grouper • Whale' },
                { label: '🪓 Sell All Wood',    value: 'woodcutting', description: 'Timber' },
                { label: '⛏️ Sell All Metals',  value: 'mining',      description: 'Copper • Silver • Gold • Diamond' },
                { label: '💰 Sell All at Once', value: 'all',         description: 'Sell all job earnings at once' },

                resetOption('سوق-مركزي'),
            ])
    );

    return { embeds: [embed], components: [menu] };
}
