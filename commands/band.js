module.exports = {
    name: 'باند',
    async execute(message, args, db) {
        const target = message.mentions.members?.first() || message.guild?.members.cache.get(args[0]);
        const reason = args.slice(1).join(' ') || 'لم يُذكر سبب';
        if (!target) return message.reply('❌ يجب ذكر اللاعب المراد باند. مثال: `-باند @اللاعب السبب`');
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setTitle('🚫 تم تنفيذ الباند')
            .setColor(0xB71C1C)
            .addFields(
                { name: '👮 المنفذ', value: `${message.author}`, inline: true },
                { name: '🎯 المستهدف', value: `${target}`, inline: true },
                { name: '📋 الحالة', value: '`محظور`', inline: true },
                { name: '📝 السبب', value: reason, inline: false },
            )
            .setFooter({ text: 'نظام الشرطة • بوت FANTASY' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
};
