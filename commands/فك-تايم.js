const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'فك-تايم',

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ ليس لديك صلاحية تنفيذ هذا الأمر.');
        }

        const target = message.mentions.members?.first();
        if (!target) {
            return message.reply('❌ **الاستخدام:** `-فك-تايم @العضو`');
        }

        if (!target.isCommunicationDisabled()) {
            return message.reply(`❌ <@${target.id}> ليس عليه تايم اوت حالياً.`);
        }

        try {
            await target.timeout(null, `فك التايم اوت بواسطة ${message.author.tag}`);
        } catch (err) {
            console.error('[فك-تايم] error:', err);
            return message.reply('❌ فشل فك التايم اوت. تأكد من أن البوت لديه الصلاحيات الكافية.');
        }

        const embed = new EmbedBuilder()
            .setColor(0x43A047)
            .setTitle('🔊 تم فك التايم اوت')
            .addFields(
                { name: '👤 العضو',  value: `<@${target.id}>`,         inline: true },
                { name: '👮 بواسطة', value: `<@${message.author.id}>`, inline: true },
            )
            .setFooter({ text: 'نظام التايم اوت • بوت FANTASY' })
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });
        await message.delete().catch(() => {});
    }
};
