const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'رسالة',
    async execute(message, args, db) {
        const target = message.mentions.members?.first();
        if (!target) return message.reply('❌ استخدم: `-رسالة @المستخدم [النص]`');
        const content = args.filter(a => !a.startsWith('<@')).join(' ').trim();
        if (!content) return message.reply('❌ اكتب نص الرسالة. مثال: `-رسالة @اللاعب كيف حالك؟`');
        if (target.id === message.author.id) return message.reply('❌ لا يمكنك إرسال رسالة لنفسك.');
        if (content.length > 500) return message.reply('❌ الرسالة طويلة جداً (الحد 500 حرف).');

        await db.ensureUser(message.author.id, message.author.username);
        await db.ensureUser(target.id, target.user.username);
        await db.sendMessage(message.author.id, target.id, content);

        const embed = new EmbedBuilder()
            .setTitle('📱 تم إرسال الرسالة')
            .setColor(0x00838F)
            .addFields(
                { name: '📤 المُرسِل', value: `${message.author}`, inline: true },
                { name: '📥 المستلم', value: `${target}`, inline: true },
                { name: '💬 الرسالة', value: `> ${content}`, inline: false },
            )
            .setFooter({ text: 'نظام الجوال • بوت FANTASY' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });

        const notif = new EmbedBuilder()
            .setTitle('📩 رسالة جديدة وصلتك!')
            .setColor(0x00838F)
            .addFields(
                { name: '📤 من', value: `${message.author}`, inline: true },
                { name: '💬 الرسالة', value: `> ${content}`, inline: false },
                { name: '↩️ للرد', value: `\`-رسالة @${message.author.username} [ردك]\``, inline: false },
            )
            .setFooter({ text: 'نظام الجوال • بوت FANTASY' })
            .setTimestamp();
        try {
            await target.send({ embeds: [notif] });
        } catch (_) {}
    }
};
