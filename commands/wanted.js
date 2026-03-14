const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'تلويت',
    async execute(message, args, db) {
        const target = message.mentions.members?.first() || message.guild?.members.cache.get(args[0]);
        if (!target) return message.reply('❌ استخدم: `-تلويت @اللاعب`');

        await db.ensureUser(target.id, target.user.username);
        const items = await db.getInventory(target.id);
        const targetIdentity = await db.getActiveIdentity(target.id);

        if (!items.length) {
            const emptyEmbed = new EmbedBuilder()
                .setTitle('🔍 تفتيش اللاعب المكلبش')
                .setColor(0xFF6F00)
                .setDescription(`تم تفتيش **${target.displayName}** — الحقيبة فارغة!`)
                .addFields(
                    { name: '👮 الضابط', value: `${message.author}`, inline: true },
                    { name: '🎯 المفتَّش', value: `${target}`, inline: true },
                    { name: '🏦 رصيد البنك', value: `\`${Number(targetIdentity.balance).toLocaleString()} ريال\``, inline: true },
                    { name: '📦 محتوى الحقيبة', value: '> الحقيبة فارغة', inline: false },
                )
                .setFooter({ text: 'نظام الشرطة • بوت FANTASY' })
                .setTimestamp();
            return message.channel.send({ embeds: [emptyEmbed] });
        }

        const stolenList = items.map(i => `• **${i.item_name}** × \`${i.quantity}\``).join('\n');

        for (const item of items) {
            await db.transferItem(target.id, message.author.id, item.item_name);
            if (item.quantity > 1) {
                for (let i = 1; i < item.quantity; i++) {
                    await db.transferItem(target.id, message.author.id, item.item_name).catch(() => {});
                }
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('🔍 تفتيش وسرقة اللاعب المكلبش')
            .setColor(0xFF6F00)
            .addFields(
                { name: '👮 الضابط', value: `${message.author}`, inline: true },
                { name: '🎯 المفتَّش', value: `${target}`, inline: true },
                { name: '🏦 رصيد البنك', value: `\`${Number(targetIdentity.balance).toLocaleString()} ريال\``, inline: true },
                { name: '📦 الأغراض المضبوطة', value: stolenList, inline: false },
                { name: '📋 الحالة', value: '`تم نقل جميع الأغراض لحقيبة الضابط`', inline: false },
            )
            .setFooter({ text: 'نظام الشرطة • بوت FANTASY' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
};
