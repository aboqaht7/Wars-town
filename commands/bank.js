const {
    EmbedBuilder,
    ActionRowBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const { resetRow } = require('../utils');
const { loadSystemBtns, makeBtn } = require('../btnConfig');

async function bankMenu(imageUrl, db) {
    const c = await loadSystemBtns(db, 'bank');
    const row = new ActionRowBuilder().addComponents(
        makeBtn('bank_balance',  c.balance),
        makeBtn('bank_deposit',  c.deposit),
        makeBtn('bank_withdraw', c.withdraw),
        makeBtn('bank_transfer', c.transfer),
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
        message.channel.send(await bankMenu(img, db));
    },

    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const img = await db.getImage('bank');
        const main = await bankMenu(img, db);
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.reply({ content: '​', flags: 64 });
    },

    bankMenu,
};
