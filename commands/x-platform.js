const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'منصة-x',
    data: new SlashCommandBuilder()
        .setName('منصة-x')
        .setDescription('منصة 𝕏 — عرض آخر المنشورات'),
    async execute(message, args, db) {
        const posts = await db.getXTimeline(8);
        const embed = buildEmbed(posts);
        const menu = buildMenu(posts);
        const components = menu ? [menu, resetRow('x_platform')] : [resetRow('x_platform')];
        message.channel.send({ embeds: [embed], components });
    },
    async slashExecute(interaction, db) {
        const posts = await db.getXTimeline(8);
        const embed = buildEmbed(posts);
        const menu = buildMenu(posts);
        const components = menu ? [menu, resetRow('x_platform')] : [resetRow('x_platform')];
        interaction.reply({ embeds: [embed], components });
    }
};

function buildEmbed(posts) {
    const embed = new EmbedBuilder()
        .setTitle('𝕏 منصة X — آخر المنشورات')
        .setColor(0x000000)
        .setFooter({ text: 'منصة X • بوت FANTASY' })
        .setTimestamp();
    if (!posts.length) {
        embed.setDescription('> لا توجد منشورات بعد. استخدم `-تغريد [نص]` لنشر أول تغريدة!');
        return embed;
    }
    for (const p of posts) {
        const time = new Date(p.created_at).toLocaleDateString('ar-SA');
        embed.addFields({
            name: `@${p.username}  •  ${time}`,
            value: `${p.content}\n❤️ \`${p.likes}\` إعجاب  •  🆔 \`#${p.id}\``,
            inline: false,
        });
    }
    return embed;
}

function buildMenu(posts) {
    if (!posts.length) return null;
    const options = posts.slice(0, 25).map(p => ({
        label: `@${p.username.slice(0, 20)}`,
        value: `like_${p.id}`,
        description: p.content.slice(0, 50),
    }));
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('x_menu')
            .setPlaceholder('❤️ اضغط للإعجاب بمنشور')
            .addOptions(options)
    );
}
