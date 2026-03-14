module.exports = {
    name: 'كلبشة',
    async execute(message, args, db) {
        const target = message.mentions.members?.first() || message.guild?.members.cache.get(args[0]);
        if (!target) return message.reply('❌ يجب ذكر اللاعب المراد كلبشته. مثال: `-كلبشة @اللاعب`');
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setTitle('🔗 تم تنفيذ الكلبشة')
            .setColor(0x1565C0)
            .addFields(
                { name: '👮 المنفذ', value: `${message.author}`, inline: true },
                { name: '🎯 المستهدف', value: `${target}`, inline: true },
                { name: '📋 الحالة', value: '`مكبّل`', inline: true },
            )
            .setFooter({ text: 'نظام الشرطة • بوت FANTASY' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
};
