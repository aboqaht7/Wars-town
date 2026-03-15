const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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
        const { embed, row } = buildTweetMessage(post, message.author.displayAvatarURL());
        const xChannel = message.guild?.channels?.cache.get(xChannelId);
        if (xChannel) await xChannel.send({ embeds: [embed], components: [row] });
        message.reply({ content: `✅ تم نشر تغريدتك في <#${xChannelId}>` });
    }
};

function buildTweetMessage(post, avatarURL) {
    const embed = new EmbedBuilder()
        .setAuthor({ name: `@${post.x_username}`, iconURL: avatarURL || undefined })
        .setColor(0x000000)
        .setDescription(post.content)
        .addFields(
            { name: '🆔 رقم المنشور', value: `\`#${post.id}\``, inline: true },
            { name: '❤️', value: `\`${post.likes ?? 0}\``, inline: true },
            { name: '🔁', value: `\`${post.retweets ?? 0}\``, inline: true },
        )
        .setFooter({ text: 'منصة X • بوت FANTASY' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`x_like_${post.id}`).setLabel(`❤️ ${post.likes ?? 0}`).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`x_retweet_${post.id}`).setLabel(`🔁 ${post.retweets ?? 0}`).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`x_reply_${post.id}`).setLabel('💬 رد').setStyle(ButtonStyle.Secondary),
    );

    return { embed, row };
}

module.exports.buildTweetMessage = buildTweetMessage;
