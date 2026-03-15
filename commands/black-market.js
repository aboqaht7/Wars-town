const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database');

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);

function buildEmbed(items) {
    const embed = new EmbedBuilder()
        .setTitle('🖤 البلاك ماركت')
        .setColor(0x1a1a2e)
        .setFooter({ text: 'البلاك ماركت • بوت FANTASY' })
        .setTimestamp();

    if (!items.length) {
        embed.setDescription('🚫 لا توجد أغراض متاحة حالياً في البلاك ماركت.');
        return embed;
    }

    embed.setDescription('اختر غرضاً من القائمة أدناه لشرائه:\n\u200b');
    embed.addFields(
        items.map(it => ({
            name: `🔹 ${it.name}`,
            value: `💰 **${Number(it.price).toLocaleString('en-US')}$**`,
            inline: true,
        }))
    );
    return embed;
}

function buildMenu(items) {
    const menu = new StringSelectMenuBuilder()
        .setCustomId('black_market_menu')
        .setPlaceholder('اختر غرضاً...')
        .addOptions(
            items.map(it => ({
                label: it.name,
                description: `${Number(it.price).toLocaleString('en-US')}$`,
                value: String(it.id),
            }))
        );
    return new ActionRowBuilder().addComponents(menu);
}

module.exports = {
    name: 'بلاك-ماركت',
    data: new SlashCommandBuilder()
        .setName('بلاك-ماركت')
        .setDescription('افتح البلاك ماركت لشراء الأغراض'),

    async slashExecute(interaction) {
        await interaction.deferReply({ flags: 64 });
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.editReply({ content: err });

        const items = await db.getBlackMarketItems();
        const embed = buildEmbed(items);
        const components = [];
        if (items.length) components.push(buildMenu(items));
        components.push(new ActionRowBuilder().addComponents(resetButton));
        return interaction.editReply({ embeds: [embed], components });
    },

    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);

        const items = await db.getBlackMarketItems();
        const embed = buildEmbed(items);
        const components = [];
        if (items.length) components.push(buildMenu(items));
        components.push(new ActionRowBuilder().addComponents(resetButton));
        return message.reply({ embeds: [embed], components });
    },
};
