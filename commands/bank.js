const {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const { resetRow } = require('../utils');

function bankMenu(imageUrl) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('bank_balance').setLabel('💰 عرض الأموال').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('bank_deposit').setLabel('📥 إيداع الكاش').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('bank_withdraw').setLabel('💸 صرف الكاش').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('bank_transfer').setLabel('🔄 تحويل').setStyle(ButtonStyle.Secondary),
    );
    const embed = new EmbedBuilder()
        .setTitle('🏦 بنك FANTASY')
        .setColor(0x1565C0)
        .setDescription('مرحباً بك في البنك. اختر الخدمة المطلوبة.')
        .setFooter({ text: 'نظام البنك • بوت FANTASY' })
        .setTimestamp();
    if (imageUrl) embed.setImage(imageUrl);
    return { embeds: [embed], components: [row, resetRow('bank')] };
}

module.exports = {
    name: 'بنك',
    data: new SlashCommandBuilder()
        .setName('بنك')
        .setDescription('افتح قائمة البنك'),

    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const img = await db.getImage('bank');
        message.channel.send(bankMenu(img));
    },

    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const img = await db.getImage('bank');
        const main = bankMenu(img);
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.reply({ content: '​', flags: 64 });
    },

    bankMenu,
};
