const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'رسالة',
    async execute(message, args, db) {
        const target = message.mentions.members?.first();
        if (!target) return message.reply('❌ Usage: `-رسالة @user [text]`');
        const content = args.filter(a => !a.startsWith('<@')).join(' ').trim();
        if (!content) return message.reply('❌ Write the message text. Example: `-رسالة @player How are you?`');
        if (target.id === message.author.id) return message.reply('❌ You cannot send a message to yourself.');
        if (content.length > 500) return message.reply('❌ Message is too long (max 500 characters).');

        await db.ensureUser(message.author.id, message.author.username);
        await db.ensureUser(target.id, target.user.username);
        await db.sendMessage(message.author.id, target.id, content);

        const _img = await db.getImage('phone').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('Message Sent')
            .setColor(0x00838F)
            .addFields(
                { name: '📤 Sender',    value: `${message.author}`, inline: true },
                { name: '📥 Recipient', value: `${target}`,         inline: true },
                { name: '💬 Message',   value: `> ${content}`,      inline: false },
            )
            .setFooter({ text: 'Phone System • FANTASY Bot' })
            .setTimestamp();
        if (_img) embed.setImage(_img);
        message.channel.send({ embeds: [embed] });

        const notif = new EmbedBuilder()
            .setTitle('New Message Received!')
            .setColor(0x00838F)
            .addFields(
                { name: '📤 From',     value: `${message.author}`, inline: true },
                { name: '💬 Message', value: `> ${content}`,       inline: false },
                { name: '↩️ To Reply', value: `\`-رسالة @${message.author.username} [your reply]\``, inline: false },
            )
            .setFooter({ text: 'Phone System • FANTASY Bot' })
            .setTimestamp();
        try {
            if (_img) notif.setImage(_img);
            await target.send({ embeds: [notif] });
        } catch (_) {}
    }
};
