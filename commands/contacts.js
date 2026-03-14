const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'جهات',
    async execute(message, args, db) {
        const target = message.mentions.members?.first();

        if (target) {
            const nickname = args.filter(a => !a.startsWith('<@')).join(' ').trim() || target.user.username;
            await db.ensureUser(message.author.id, message.author.username);
            await db.ensureUser(target.id, target.user.username);
            await db.addContact(message.author.id, target.id, nickname);
            const embed = new EmbedBuilder()
                .setTitle('📒 تم إضافة جهة الاتصال')
                .setColor(0x00838F)
                .addFields(
                    { name: '👤 الجهة', value: `${target}`, inline: true },
                    { name: '🏷️ الاسم المحفوظ', value: `\`${nickname}\``, inline: true },
                )
                .setFooter({ text: 'نظام الجوال • بوت FANTASY' })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }

        await db.ensureUser(message.author.id, message.author.username);
        const contacts = await db.getContacts(message.author.id);
        const embed = new EmbedBuilder()
            .setTitle('📒 جهات الاتصال')
            .setColor(0x00838F)
            .setDescription(contacts.length
                ? contacts.map(c => `• ${c.nickname || c.username} — \`<@${c.contact_id}>\``).join('\n')
                : '> لا توجد جهات اتصال. استخدم `-جهات @مستخدم [الاسم]` لإضافة جهة')
            .addFields({ name: '📊 العدد', value: `\`${contacts.length}\``, inline: true })
            .setFooter({ text: 'نظام الجوال • بوت FANTASY' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
};
