const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'قاضي',
    data: new SlashCommandBuilder().setName('قاضي').setDescription('🏛️ لوحة القاضي — القضايا الجارية'),

    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const judge = await db.getJudgeById(message.author.id);
        if (!judge) return message.reply('❌ أنت لست مسجلاً كقاضٍ معتمد.');
        message.channel.send(await build(db, message.author.id, judge.judge_name));
    },

    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const judgeRoleId = await db.getConfig('judge_role_id');
        if (judgeRoleId && !interaction.member.roles.cache.has(judgeRoleId))
            return interaction.reply({ content: '❌ هذا الأمر للقضاة المعتمدين فقط.', flags: 64 });
        const judge = await db.getJudgeById(interaction.user.id);
        if (!judge) return interaction.reply({ content: '❌ أنت لست مسجلاً كقاضٍ معتمد.', flags: 64 });
        await interaction.channel.send(await build(db, interaction.user.id, judge.judge_name));
        await interaction.reply({ content: '​', flags: 64 });
    },
};

async function build(db, judgeId, judgeName) {
    const cases = await db.getCasesByJudge(judgeId);
    const img = await db.getImage('عدل');

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
