const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'سناب',
    data: new SlashCommandBuilder().setName('سناب').setDescription('سناب شات — الرسائل والأصدقاء'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const account = await db.getSnapAccount(message.author.id);
        const img = await db.getImage('snap');
        message.channel.send(build(account, img));
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const account = await db.getSnapAccount(interaction.user.id);
        const img = await db.getImage('snap');
        interaction.reply(build(account, img));
    }
};

function build(account, image) {
    const embed = new EmbedBuilder()
        .setColor(0xFFFC00)
        .setFooter({ text: 'سناب شات • بوت FANTASY' })
        .setTimestamp();

    if (image) embed.setImage(image);

    if (!account) {
        embed.setTitle('👻 سناب شات')
            .setDescription('أنشئ حسابك على سناب شات وابدأ التواصل مع أصدقائك!');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('snap_create').setLabel('✨ إنشاء حساب').setStyle(ButtonStyle.Primary),
        );
        return { embeds: [embed], components: [row, resetRow('سناب')] };
    }

    embed.setTitle(`👻 ${account.snap_username}`)
        .setDescription(`**⭐ سناب سكور:** \`${account.score}\``);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('snap_send').setLabel('📸 إرسال سناب').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('snap_inbox').setLabel('📬 الوارد').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('snap_friends').setLabel('👥 أصدقائي').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('snap_add').setLabel('➕ إضافة صديق').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('snap_requests').setLabel('🔔 الطلبات').setStyle(ButtonStyle.Danger),
    );
    return { embeds: [embed], components: [row, resetRow('سناب')] };
}
