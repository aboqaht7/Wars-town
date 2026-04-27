const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'صندوق',
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const msgs = await db.getMessages(message.author.id, 10);
        await db.markMessagesRead(message.author.id);

        const _img = await db.getImage('Snapchat').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Inbox')
            .setColor(0x00838F)
            .setFooter({ text: 'Phone System • FANTASY Bot' })
            .setTimestamp();

        if (!msgs.length) {
            embed.setDescription('> No messages in your inbox');
        } else {
            for (const m of msgs) {
                const dir = m.sender_id === message.author.id ? '📤 Sent to' : '📥 From';
                const name = m.sender_id === message.author.id ? m.receiver_name : m.sender_name;
                const time = new Date(m.created_at).toLocaleString('en-GB');
                embed.addFields({
                    name: `${dir} @${name || 'Unknown'}  •  ${time}`,
                    value: `> ${m.content}`,
                    inline: false,
                });
            }
        }
        if (_img) embed.setImage(_img);
        message.channel.send({ embeds: [embed] });
    }
};
