const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');

module.exports = {
    name: 'نقاط-الادارة',
    data: new SlashCommandBuilder()
        .setName('نقاط-الادارة')
        .setDescription('بانل نقاط الإدارة العام'),

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
        leaderboard = '> لا توجد بيانات بعد.';
    } else {
        leaderboard = all.slice(0, 10).map((row, i) => {
            const total = Number(row.total) || 0;
            const medal = medals[i] || `${i + 1}.`;
            return `${medal} <@${row.discord_id}> — **${total} نقطة**`;
        }).join('\n');
    }

    const embed = new EmbedBuilder()
        .setTitle('Admin Points Dashboard')
        .setColor(0x1565C0)
        .addFields(
            {
                name: '🏆 ترتيب الموظفين',
                value: leaderboard,
                inline: false
            }
        )
        .setFooter({ text: 'نظام نقاط الإدارة • بوت FANTASY' })
        .setTimestamp();

    const img = await db.getImage('نقاط-الادارة');
    if (img) embed.setImage(img);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('points_check')
            .setLabel('كشف نقاطي').setEmoji('📋')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('points_add_btn')
            .setLabel('إضافة نقاط').setEmoji('➕')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('points_deduct_btn')
            .setLabel('خصم نقاط').setEmoji('➖')
            .setStyle(ButtonStyle.Danger),
    );

    return { embeds: [embed], components: [row] };
}
