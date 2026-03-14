module.exports = {
    name: 'تشهير',
    async execute(message, args, db) {
        const target = message.mentions.members?.first() || message.guild?.members.cache.get(args[0]);
        const reason = args.slice(1).join(' ') || 'لم يُذكر سبب';
        if (!target) return message.reply('❌ يجب ذكر اللاعب المراد تشهيره. مثال: `-تشهير @اللاعب السبب`');
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setTitle('📢 تم تنفيذ التشهير')
            .setColor(0x6A1B9A)
            .addFields(
                { name: '👮 المنفذ', value: `${message.author}`, inline: true },
                { name: '🎯 المستهدف', value: `${target}`, inline: true },
                { name: '📋 الحالة', value: '`مشهّر`', inline: true },
                { name: '📝 السبب', value: reason, inline: false },
            )
            .setFooter({ text: 'نظام الشرطة • بوت FANTASY' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
};
