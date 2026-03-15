const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'تغريد',
    async execute(message, args, db) {
        const content = args.join(' ').trim();
        if (!content) return message.reply('❌ اكتب نص التغريدة. مثال: `-تغريد مرحباً!`');
        if (content.length > 280) return message.reply('❌ التغريدة طويلة جداً (الحد 280 حرف).');
        await db.ensureUser(message.author.id, message.author.username);
        const account = await db.getXAccount(message.author.id);
        if (!account) return message.reply('❌ ليس لديك حساب على منصة X. استخدم `/منصة-x` وأنشئ حساباً أولاً.');
        const xChannelId = await db.getConfig('x_channel');
        if (!xChannelId) return message.reply('❌ لم يتم تحديد روم التغريدات بعد.');
        const post = await db.postTweet(message.author.id, content);
        const embed = new EmbedBuilder()
            .setAuthor({ name: `@${account.x_username}`, iconURL: message.author.displayAvatarURL() })
            .setColor(0x000000)
            .setDescription(content)
            .addFields(
                { name: '🆔 رقم المنشور', value: `\`#${post.id}\``, inline: true },
                { name: '❤️ الإعجابات', value: '`0`', inline: true },
            )
            .setFooter({ text: 'منصة X • بوت FANTASY' })
            .setTimestamp();
        const xChannel = message.guild?.channels?.cache.get(xChannelId);
        if (xChannel) await xChannel.send({ embeds: [embed] });
        message.reply({ content: `✅ تم نشر تغريدتك في <#${xChannelId}>` });
    }
};
