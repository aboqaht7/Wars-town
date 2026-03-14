const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'phone',
    data: new SlashCommandBuilder()
        .setName('phone')
        .setDescription('عرض الجوال'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const unread = await db.getUnreadCount(message.author.id);
        const { embed, menu } = build(message.author.username, unread, await db.getImage('phone'));
        message.channel.send({ embeds: [embed], components: [menu, resetRow('phone')] });
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const unread = await db.getUnreadCount(interaction.user.id);
        const { embed, menu } = build(interaction.user.username, unread, await db.getImage('phone'));
        interaction.reply({ embeds: [embed], components: [menu, resetRow('phone')] });
    }
};

function build(username, unread, image) {
    const embed = new EmbedBuilder()
        .setTitle('📱 الجوال')
        .setColor(0x00838F)
        .setDescription(`هاتف **${username}** الشخصي`)
        .addFields(
            { name: '📩 رسائل غير مقروءة', value: `\`${unread}\``, inline: true },
            { name: '📱 إرسال رسالة', value: '`-رسالة @مستخدم [نص]`', inline: true },
            { name: '📬 صندوق الرسائل', value: '`-صندوق`', inline: true },
            { name: '📒 جهات الاتصال', value: '`-جهات` أو `-جهات @مستخدم`', inline: true },
            { name: '𝕏 منصة X', value: '`/منصة-x` • `-تغريد [نص]`', inline: true },
        )
        .setImage(image || null)
        .setFooter({ text: 'نظام الجوال • بوت FANTASY' })
        .setTimestamp();
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('phone_menu')
            .setPlaceholder('اختر تطبيق')
            .addOptions([
                { label: '📩 الرسائل', value: 'messages', description: 'عرض صندوق رسائلك' },
                { label: '📒 جهات الاتصال', value: 'contacts', description: 'عرض جهات اتصالك' },
                { label: '👻 سناب شات', value: 'snap', description: 'الرسائل والأصدقاء والستريك' },
                { label: '𝕏 منصة X', value: 'x_platform', description: 'عرض آخر منشورات منصة X' },
            ])
    );
    return { embed, menu };
}
