const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'تغريد',
    async execute(message, args, db) {
        const content = args.join(' ').trim();
        if (!content) return message.reply('❌ Write the tweet text. Example: `-تغريد Hello!`');
        if (content.length > 280) return message.reply('❌ Tweet is too long (max 280 characters).');
        await db.ensureUser(message.author.id, message.author.username);
        const account = await db.getXAccount(message.author.id);
        if (!account) return message.reply('❌ You do not have an X Platform account. Use `/منصة-x` to create one first.');
        const xChannelId = await db.getConfig('x_channel');
        if (!xChannelId) return message.reply('❌ The tweets channel has not been set yet.');
        const post = await db.postTweet(message.author.id, content);
        const { embed, row } = await buildTweetMessage(post, message.author.displayAvatarURL(), db);
        const xChannel = message.guild?.channels?.cache.get(xChannelId);
        if (xChannel) await xChannel.send({ embeds: [embed], components: [row] });
        message.reply({ content: `✅ Your tweet has been posted in <#${xChannelId}>` });
    }
};

async function buildTweetMessage(post, avatarURL, db) {
    const _img = await db.getImage('x_platform').catch(() => null);

    const embed = new EmbedBuilder()
        .setAuthor({ name: `@${post.x_username}`, iconURL: avatarURL || undefined })
        .setColor(0xE53935)
        .setDescription(post.content)
        .addFields(
            { name: '🆔 Post ID', value: `\`#${post.id}\``, inline: true },
            { name: '❤️', value: `\`${post.likes ?? 0}\``, inline: true },
            { name: '🔁', value: `\`${post.retweets ?? 0}\``, inline: true },
        )
        .setFooter({ text: 'X Platform • FANTASY Bot' })
        .setTimestamp();
    if (_img) embed.setImage(_img);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`x_like_${post.id}`).setLabel(`${post.likes ?? 0}`).setEmoji('❤️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`x_retweet_${post.id}`).setLabel(`${post.retweets ?? 0}`).setEmoji('🔁').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`x_reply_${post.id}`).setLabel('Reply').setEmoji('💬').setStyle(ButtonStyle.Secondary),
    );

    return { embed, row };
}

module.exports.buildTweetMessage = buildTweetMessage;
