const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');

module.exports = {
    name: 'نقاط-الادارة',
    data: new SlashCommandBuilder()
        .setName('نقاط-الادارة')
        .setDescription('بانل نقاط Admin العام'),

    async execute(message, args, db) {
        const payload = await buildPanel(db);
        await message.channel.send(payload);
    },

    async slashExecute(interaction, db) {
        await interaction.deferReply({ flags: 64 });
        await interaction.channel.send(await buildPanel(db));
        await interaction.deleteReply().catch(() => {});
    }
};

async function buildPanel(db) {
    const all = await db.getAllStaffActivity();

    const medals = ['🥇', '🥈', '🥉'];
    let leaderboard = '';

    if (!all.length) {
        leaderboard = '> No data yet.';
    } else {
        leaderboard = all.slice(0, 10).map((row, i) => {
            const total = Number(row.total) || 0;
            const medal = medals[i] || `${i + 1}.`;
            return `${medal} <@${row.discord_id}> — **${total} pts**`;
        }).join('\n');
    }

    const embed = new EmbedBuilder()
        .setTitle('Admin Points Dashboard')
        .setColor(0xE53935)
        .addFields(
            {
                name: '🏆 Staff Leaderboard',
                value: leaderboard,
                inline: false
            }
        )
        .setFooter({ text: 'Admin Points System • FANTASY Bot' })
        .setTimestamp();

    const img = await db.getImage('نقاط-الادارة');
    if (img) embed.setImage(img);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('points_check')
            .setLabel('My Points').setEmoji('📋')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('points_add_btn')
            .setLabel('Add Points').setEmoji('➕')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('points_deduct_btn')
            .setLabel('Deduct Points').setEmoji('➖')
            .setStyle(ButtonStyle.Danger),
    );

    return { embeds: [embed], components: [row] };
}
