module.exports = {
    name: 'تلويت',
    async execute(message, args, db) {
        const target = message.mentions.members?.first() || message.guild?.members.cache.get(args[0]);
        if (!target) return message.reply('❌ يجب ذكر اللاعب المراد تلويته. مثال: `-تلويت @اللاعب`');
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setTitle('🚨 تم إضافة اللاعب للمطلوبين')
            .setColor(0xFF6F00)
            .addFields(
                { name: '👮 المنفذ', value: `${message.author}`, inline: true },
                { name: '🎯 المستهدف', value: `${target}`, inline: true },
                { name: '📋 الحالة', value: '`مطلوب`', inline: true },
            )
            .setFooter({ text: 'نظام الشرطة • بوت FANTASY' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
};
