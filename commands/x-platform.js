const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'منصة-x',
    data: new SlashCommandBuilder().setName('منصة-x').setDescription('منصة 𝕏 — عرض آخر المنشورات'),
    async execute(message, args, db) {
        const posts = await db.getXTimeline(8);
        const { embed, components } = build(posts);
        message.channel.send({ embeds: [embed], components });
    },
    async slashExecute(interaction, db) {
        const posts = await db.getXTimeline(8);
        const { embed, components } = build(posts);
        interaction.reply({ embeds: [embed], components });
    }
};

function build(posts) {
    const embed = new EmbedBuilder()
        .setTitle('𝕏 منصة X')
        .setColor(0x000000)
        .setDescription('استعرض آخر المنشورات وتفاعل معها.')
        .setFooter({ text: 'منصة X • بوت FANTASY' })
        .setTimestamp();

    const components = [resetRow('x_platform')];
    if (posts.length) {
        const options = posts.slice(0, 25).map(p => ({
            label: `@${p.username.slice(0, 20)}`,
            value: `like_${p.id}`,
            description: p.content.slice(0, 50),
        }));
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('x_menu')
                .setPlaceholder('❤️ اضغط للإعجاب بمنشور')
                .addOptions(options)
        );
        components.unshift(menu);
    }
    return { embed, components };
}
