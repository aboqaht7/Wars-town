const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, StringSelectMenuBuilder
} = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'قاضي',
    data: new SlashCommandBuilder().setName('قاضي').setDescription('🏛️ قائمة القضاة المعتمدين'),

    async execute(message, args, db) {
        message.channel.send(await buildMain(db));
    },

    async slashExecute(interaction, db) {
        const main = await buildMain(db);
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.reply({ content: '\u200b', flags: 64 });
    },
};

module.exports.buildMain          = buildMain;
module.exports.buildJudgeDashboard = buildJudgeDashboard;

/* ─── اللوحة الرئيسية: قائمة كل القضاة + منيو ─── */
async function buildMain(db) {
    const judges = await db.getJudges();
    const img    = await db.getImage('عدل');

    const embed = new EmbedBuilder()
        .setTitle('🏛️ القضاة المعتمدون')
        .setColor(0x4A148C)
        .setFooter({ text: 'نظام العدل • بوت FANTASY' })
        .setTimestamp();

    if (img) embed.setThumbnail(img);

    if (!judges.length) {
        embed.setDescription('> 📭 لا يوجد قضاة مسجلون حالياً');
        return { embeds: [embed], components: [resetRow('قاضي')] };
    }

    embed.setDescription(
        judges.map((j, i) => `**${i + 1}.** ${j.judge_name} — <@${j.discord_id}>`).join('\n')
    );

    const menu = new StringSelectMenuBuilder()
        .setCustomId('judge_select')
        .setPlaceholder('🏛️ اختر قاضياً لعرض قضاياه')
        .addOptions(
            judges.slice(0, 25).map(j => ({
                label: j.judge_name,
                value: j.discord_id,
                description: `عرض القضايا الجارية لـ ${j.judge_name}`,
                emoji: '⚖️',
            }))
        );

    return {
        embeds: [embed],
        components: [
            new ActionRowBuilder().addComponents(menu),
            resetRow('قاضي'),
        ],
    };
}

/* ─── لوحة قاضٍ بعينه: قضاياه الجارية ─── */
async function buildJudgeDashboard(db, judgeId, judgeName) {
    const cases = await db.getCasesByJudge(judgeId);
    const img   = await db.getImage('عدل');

    const embed = new EmbedBuilder()
        .setTitle('🏛️ لوحة القاضي')
        .setColor(0x4A148C)
        .setAuthor({ name: `القاضي: ${judgeName}` })
        .setFooter({ text: 'نظام العدل • بوت FANTASY' })
        .setTimestamp();

    if (img) embed.setThumbnail(img);

    if (!cases.length) {
        embed.setDescription('> 📭 لا توجد قضايا جارية مُسنَدة إليك حالياً');
    } else {
        embed.setDescription(`> ⚖️ لديك **${cases.length}** قضية جارية — استخدم \`/عدل\` لإصدار الأحكام`);
        embed.addFields(
            cases.slice(0, 10).map((c, i) => ({
                name: `${i + 1}. 📁 ${c.case_number} — ${c.title}`,
                value: [
                    `👤 المدعي: **${c.plaintiff_name}**`,
                    `⚔️ المدعى عليه: **${c.defendant || '—'}**`,
                    c.lawyer_name ? `👨‍⚖️ المحامي: **${c.lawyer_name}**` : '',
                ].filter(Boolean).join(' • '),
                inline: false,
            }))
        );
    }

    return { embeds: [embed], components: [resetRow('قاضي')] };
}
