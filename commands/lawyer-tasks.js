const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'مهام-محامي',
    data: new SlashCommandBuilder()
        .setName('مهام-محامي')
        .setDescription('⚖️ عرض طلبات التوكيل الخاصة بك وقبولها أو رفضها'),

    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const allLawyers = await db.getLawyers();
        const lawyer = allLawyers.find(l => l.discord_id === message.author.id);
        if (!lawyer) return message.reply('❌ أنت لست مسجلاً كمحامٍ معتمد.');
        message.channel.send(await build(db, message.author.id, lawyer.lawyer_name));
    },

    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const allLawyers = await db.getLawyers();
        const lawyer = allLawyers.find(l => l.discord_id === interaction.user.id);
        if (!lawyer)
            return interaction.reply({ content: '❌ أنت لست مسجلاً كمحامٍ معتمد.', flags: 64 });
        await interaction.channel.send(await build(db, interaction.user.id, lawyer.lawyer_name));
        await interaction.reply({ content: '\u200b', flags: 64 });
    },
};

module.exports.buildTasks = build;

async function build(db, lawyerId, lawyerName) {
    const requests = await db.getLawyerRequests(lawyerId);
    const img      = await db.getImage('محاماة');

    const embed = new EmbedBuilder()
        .setTitle('📋 مهام المحامي — طلبات التوكيل')
        .setColor(0x0D47A1)
        .setAuthor({ name: `المحامي: ${lawyerName}` })
        .setFooter({ text: 'نظام المحاماة • بوت FANTASY' })
        .setTimestamp();

    if (img) embed.setThumbnail(img);

    const components = [];

    if (!requests.length) {
        embed.setDescription('> 📭 لا توجد طلبات توكيل معلقة حالياً');
    } else {
        embed.setDescription(`> 📬 لديك **${requests.length}** طلب توكيل معلق`);

        // أول 8 طلبات كحقول تفصيلية
        embed.addFields(
            requests.slice(0, 8).map((r, i) => ({
                name: `${i + 1}. 📁 ${r.case_number} — ${r.case_title}`,
                value: [
                    `👤 **الموكّل:** ${r.plaintiff_name} (<@${r.plaintiff_id}>)`,
                    `📌 **موضوع القضية:** ${r.case_title}`,
                ].join('\n'),
                inline: false,
            }))
        );

        // أزرار قبول / رفض لكل طلب (حتى 4)
        for (const r of requests.slice(0, 4)) {
            components.push(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`lawyer_req_accept_${r.id}`)
                        .setLabel(`✅ قبول — ${r.case_number}`)
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`lawyer_req_reject_${r.id}`)
                        .setLabel(`❌ رفض — ${r.case_number}`)
                        .setStyle(ButtonStyle.Danger),
                )
            );
        }
    }

    components.push(resetRow('مهام-محامي'));
    return { embeds: [embed], components };
}
