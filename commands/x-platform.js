const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'منصة-x',
    data: new SlashCommandBuilder().setName('منصة-x').setDescription('منصة 𝕏'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const img = await db.getImage('x_platform');
        const account = await db.getXAccount(message.author.id);
        message.channel.send(build(img, account));
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const img = await db.getImage('x_platform');
        const account = await db.getXAccount(interaction.user.id);
        await interaction.channel.send(build(img, account));
        await interaction.reply({ content: '​', flags: 64 });
    }
};

function build(image, account) {
    const embed = new EmbedBuilder()
        .setTitle('𝕏 منصة X')
        .setColor(0x000000)
        .setDescription(account
            ? `مرحباً **@${account.x_username}** — اختر ما تريد فعله.`
            : 'أنشئ حسابك على منصة X وابدأ التغريد.')
        .setFooter({ text: 'منصة X • بوت FANTASY' })
        .setTimestamp();
    if (image) embed.setImage(image);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('x_create_account').setLabel('✨ إنشاء حساب').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('x_send_tweet').setLabel('🐦 إرسال تغريدة').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('x_delete_account').setLabel('🗑️ حذف الحساب').setStyle(ButtonStyle.Danger),
    );

    return { embeds: [embed], components: [row, resetRow('x_platform')] };
}
