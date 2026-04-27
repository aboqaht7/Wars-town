const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, StringSelectMenuBuilder
} = require('discord.js');
const { resetRow, resetOption } = require('../utils');

module.exports = {
    name: 'قاضي',
    data: new SlashCommandBuilder().setName('قاضي').setDescription('🏛️ Certified Judges List'),

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

async function buildMain(db) {
    const judges = await db.getJudges();
    const img    = await db.getImage('عدل');

    const embed = new EmbedBuilder()
        .setTitle('Certified Judges')
        .setColor(0x4A148C)
        .setFooter({ text: 'Justice System • FANTASY Bot' })
        .setTimestamp();

    if (img) embed.setThumbnail(img);

    if (!judges.length) {
        embed.setDescription('> 📭 No judges registered currently');
        return { embeds: [embed], components: [resetRow('قاضي')] };
    }

    embed.setDescription(
        judges.map((j, i) => `**${i + 1}.** ${j.judge_name} — <@${j.discord_id}>`).join('\n')
    );

    const menu = new StringSelectMenuBuilder()
        .setCustomId('judge_select')
        .setPlaceholder('🏛️ Choose a judge to view their cases')
        .addOptions([
            ...judges.slice(0, 24).map(j => ({
                label: j.judge_name,
                value: j.discord_id,
                description: `View ongoing cases for ${j.judge_name}`,
                emoji: '⚖️',
            })),
            resetOption('قاضي'),
        ]);

    return {
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(menu)],
    };
}

async function buildJudgeDashboard(db, judgeId, judgeName) {
    const cases = await db.getCasesByJudge(judgeId);
    const img   = await db.getImage('عدل');

    const embed = new EmbedBuilder()
        .setTitle('Judge Dashboard')
        .setColor(0x4A148C)
        .setAuthor({ name: `Judge: ${judgeName}` })
        .setFooter({ text: 'Justice System • FANTASY Bot' })
        .setTimestamp();

    if (img) embed.setThumbnail(img);

    if (!cases.length) {
        embed.setDescription('> 📭 No ongoing cases assigned to you currently');
    } else {
        embed.setDescription(`> ⚖️ You have **${cases.length}** ongoing case(s) — use \`/عدل\` to issue verdicts`);
        embed.addFields(
            cases.slice(0, 10).map((c, i) => ({
                name: `${i + 1}. 📁 ${c.case_number} — ${c.title}`,
                value: [
                    `👤 Plaintiff: **${c.plaintiff_name}**`,
                    `⚔️ Defendant: **${c.defendant || '—'}**`,
                    c.lawyer_name ? `👨‍⚖️ Lawyer: **${c.lawyer_name}**` : '',
                ].filter(Boolean).join(' • '),
                inline: false,
            }))
        );
    }

    return { embeds: [embed], components: [resetRow('قاضي')] };
}
