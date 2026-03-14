const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'كاركتر-لوق',
    async execute(message, args, db) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply('❌ هذا الأمر للمسؤولين فقط.');
        }
        const channel = message.mentions.channels.first();
        if (!channel) return message.reply('❌ استخدم: `-كاركتر-لوق #القناة`');

        await db.setConfig('character_log_channel', channel.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ تم تعيين قناة سجل الشخصيات')
            .setColor(0x37474F)
            .addFields(
                { name: '📋 القناة المحددة', value: `<#${channel.id}>`, inline: true },
                { name: 'ℹ️ ما يُرسل تلقائياً', value: 'تسجيل دخول • تسجيل خروج • إعصار\nطلب هوية • قبول هوية • رفض هوية', inline: false },
            )
            .setFooter({ text: 'بوت FANTASY' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
};
