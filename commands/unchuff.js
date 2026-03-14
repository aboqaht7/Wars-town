const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'فك-كلبشة',
    async execute(message, args, db) {
        const target = message.mentions.members?.first() || message.guild?.members.cache.get(args[0]);
        if (!target) return message.reply('❌ استخدم: `-فك-كلبشة @اللاعب`');

        const embed = new EmbedBuilder()
            .setTitle('🔓 تم فك الكلبشة')
            .setColor(0x43A047)
            .addFields(
                { name: '👮 المنفذ', value: `${message.author}`, inline: true },
                { name: '🎯 اللاعب', value: `${target}`, inline: true },
                { name: '📋 الحالة', value: '`محرر`', inline: true },
            )
            .setFooter({ text: 'نظام الشرطة • بوت FANTASY' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
};
