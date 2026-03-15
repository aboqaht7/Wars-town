const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'محامي',
    data: new SlashCommandBuilder().setName('محامي').setDescription('⚖️ لوحة المحامي — طلبات التوكيل'),

    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const lawyer = await db.getLawyers().then(l => l.find(x => x.discord_id === message.author.id));
        if (!lawyer) return message.reply('❌ أنت لست مسجلاً كمحامٍ معتمد.');
        message.channel.send(await build(db, message.author.id, lawyer.lawyer_name));
    },

    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const allLawyers = await db.getLawyers();
        const lawyer = allLawyers.find(l => l.discord_id === interaction.user.id);
        if (!lawyer) return interaction.reply({ content: '❌ أنت لست مسجلاً كمحامٍ معتمد.', flags: 64 });
        await interaction.channel.send(await build(db, interaction.user.id, lawyer.lawyer_name));
        await interaction.reply({ content: '​', flags: 64 });
    },
};

module.exports.buildDashboard = build;

async function build(db, lawyerId, lawyerName) {
    const requests = await db.getLawyerRequests(lawyerId);
    const img = await db.getImage('محاماة');

    const embed = new EmbedBuilder()
        .setTitle('⚖️ لوحة المحامي')
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
        embed.addFields(
            requests.slice(0, 8).map(r => ({
                name: `📁 ${r.case_number} — ${r.case_title}`,
                value: `👤 الموكّل: **${r.plaintiff_name}** (<@${r.plaintiff_id}>)`,
                inline: false,
            }))
        );
        for (const r of requests.slice(0, 4)) {
            components.push(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`lawyer_req_accept_${r.id}`)
                        .setLabel(`✅ قبول ${r.case_number}`)
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`lawyer_req_reject_${r.id}`)
                        .setLabel(`❌ رفض ${r.case_number}`)
                        .setStyle(ButtonStyle.Danger),
                )
            );
        }
    }

    components.push(resetRow('محامي'));
    return { embeds: [embed], components };
}
