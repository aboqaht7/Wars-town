const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'فك-كلبشة',

    async execute(message, args, db) {
        const target = message.mentions.members?.first();
        if (!target) return message.reply('❌ استخدم: `-فك-كلبشة @اللاعب`');

        const cuffData = await db.isCuffed(target.id);
        if (!cuffData) return message.reply(`❌ <@${target.id}> غير مكبّل.`);

        await db.uncuffPlayer(target.id);

        const embed = new EmbedBuilder()
            .setTitle('🔓 تم فك الكلبشة')
            .setColor(0x2E7D32)
            .addFields(
                { name: '👮 المنفذ',    value: `<@${message.author.id}>`, inline: true },
                { name: '🎯 اللاعب',   value: `<@${target.id}>`,         inline: true },
                { name: '📋 الحالة',   value: '`محرر 🔓`',               inline: true },
            )
            .setFooter({ text: 'نظام الشرطة • بوت FANTASY' })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
        message.delete().catch(() => {});
    }
};
