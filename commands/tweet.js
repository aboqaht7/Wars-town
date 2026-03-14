const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'تغريد',
    async execute(message, args, db) {
        const content = args.join(' ').trim();
        if (!content) return message.reply('❌ اكتب نص التغريدة. مثال: `-تغريد مرحباً بالجميع!`');
        if (content.length > 280) return message.reply('❌ التغريدة طويلة جداً (الحد 280 حرف).');

        await db.ensureUser(message.author.id, message.author.username);
        const post = await db.postTweet(message.author.id, message.author.username, content);

        const embed = new EmbedBuilder()
            .setTitle('𝕏 تم نشر التغريدة')
            .setColor(0x000000)
            .setDescription(`> ${content}`)
            .addFields(
                { name: '👤 الحساب', value: `@${message.author.username}`, inline: true },
                { name: '🆔 رقم المنشور', value: `\`#${post.id}\``, inline: true },
                { name: '❤️ الإعجابات', value: '`0`', inline: true },
            )
            .setFooter({ text: 'منصة X • بوت FANTASY' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
};
