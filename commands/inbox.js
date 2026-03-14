const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'صندوق',
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const msgs = await db.getMessages(message.author.id, 10);
        await db.markMessagesRead(message.author.id);

        const embed = new EmbedBuilder()
            .setTitle('📬 صندوق الرسائل')
            .setColor(0x00838F)
            .setFooter({ text: 'نظام الجوال • بوت FANTASY' })
            .setTimestamp();

        if (!msgs.length) {
            embed.setDescription('> لا توجد رسائل في صندوقك');
        } else {
            for (const m of msgs) {
                const dir = m.sender_id === message.author.id ? '📤 أرسلت لـ' : '📥 من';
                const name = m.sender_id === message.author.id ? m.receiver_name : m.sender_name;
                const time = new Date(m.created_at).toLocaleString('ar-SA');
                embed.addFields({
                    name: `${dir} @${name || 'مجهول'}  •  ${time}`,
                    value: `> ${m.content}`,
                    inline: false,
                });
            }
        }
        message.channel.send({ embeds: [embed] });
    }
};
