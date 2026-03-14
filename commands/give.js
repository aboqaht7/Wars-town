const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'نقل',
    async execute(message, args, db) {
        const target = message.mentions.members?.first();
        if (!target) {
            return message.reply('❌ استخدم: `-نقل [اسم الغرض] @المستخدم`\nمثال: `-نقل سنارة @اللاعب`');
        }
        const itemName = args.slice(0, args.findIndex(a => a.startsWith('<@'))).join(' ').trim()
            || args.filter(a => !a.startsWith('<@')).join(' ').trim();
        if (!itemName) {
            return message.reply('❌ يجب تحديد اسم الغرض. مثال: `-نقل سنارة @اللاعب`');
        }
        if (target.id === message.author.id) {
            return message.reply('❌ لا يمكنك نقل غرض لنفسك.');
        }
        await db.ensureUser(message.author.id, message.author.username);
        await db.ensureUser(target.id, target.user.username);
        const result = await db.transferItem(message.author.id, target.id, itemName);
        if (!result.success) {
            return message.reply(`❌ ${result.error}`);
        }
        const embed = new EmbedBuilder()
            .setTitle('📦 تم نقل الغرض')
            .setColor(0xE65100)
            .addFields(
                { name: '👤 المُرسِل', value: `${message.author}`, inline: true },
                { name: '🎯 المُستلِم', value: `${target}`, inline: true },
                { name: '📦 الغرض', value: `\`${itemName}\``, inline: true },
            )
            .setFooter({ text: 'نظام الحقيبة • بوت FANTASY' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
};
