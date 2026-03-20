const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'كلبشة',

    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);

        const loginErr = await db.checkLoginAndIdentity(message.author.id);
        if (loginErr) return message.reply(loginErr);

        const target = message.mentions.members?.first();
        if (!target) return message.reply('❌ استخدم: `-كلبشة @اللاعب`');
        if (target.id === message.author.id) return message.reply('❌ لا تقدر تكلبش نفسك.');
        if (target.user.bot) return message.reply('❌ لا تقدر تكلبش بوت.');

        const hasCuffs = await db.hasItem(message.author.id, 'كلبشات');
        if (!hasCuffs) return message.reply('❌ ما عندك **كلبشات** في حقيبتك.');

        const alreadyCuffed = await db.isCuffed(target.id);
        if (alreadyCuffed) return message.reply(`❌ <@${target.id}> مكبّل بالفعل.`);

        await db.removeItem(message.author.id, 'كلبشات', 1);
        await db.cuffPlayer(target.id, message.author.id);

        const embed = new EmbedBuilder()
            .setTitle('🔗 تم تنفيذ الكلبشة')
            .setColor(0xB71C1C)
            .setDescription(`تم تكبيل <@${target.id}> بنجاح.\n⚠️ المكبّل لا يستطيع القيام بأي إجراء.`)
            .addFields(
                { name: '👮 المنفذ',    value: `<@${message.author.id}>`, inline: true },
                { name: '🎯 المستهدف', value: `<@${target.id}>`,         inline: true },
                { name: '📋 الحالة',   value: '`مكبّل 🔗`',              inline: true },
            )
            .setFooter({ text: 'نظام الشرطة • بوت FANTASY' })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
        message.delete().catch(() => {});
    }
};
