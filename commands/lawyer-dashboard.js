const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, StringSelectMenuBuilder
} = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'محامي',
    data: new SlashCommandBuilder().setName('محامي').setDescription('⚖️ قائمة المحامين المعتمدين'),

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

module.exports.buildDashboard  = buildDashboard;
module.exports.buildMain       = buildMain;

/* ─── اللوحة الرئيسية: قائمة كل المحامين + منيو ─── */
async function buildMain(db) {
    const lawyers = await db.getLawyers();
    const img     = await db.getImage('محاماة');

    const embed = new EmbedBuilder()
        .setTitle('⚖️ المحامون المعتمدون')
        .setColor(0x0D47A1)
        .setFooter({ text: 'نظام المحاماة • بوت FANTASY' })
        .setTimestamp();

    if (img) embed.setThumbnail(img);

    if (!lawyers.length) {
        embed.setDescription('> 📭 لا يوجد محامون مسجلون حالياً');
        return { embeds: [embed], components: [resetRow('محامي')] };
    }

    embed.setDescription(
        lawyers.map((l, i) => `**${i + 1}.** ${l.lawyer_name} — <@${l.discord_id}>`).join('\n')
    );

    const menu = new StringSelectMenuBuilder()
        .setCustomId('lawyer_select')
        .setPlaceholder('👤 اختر محامياً لعرض لوحته')
        .addOptions(
            lawyers.slice(0, 25).map(l => ({
                label: l.lawyer_name,
                value: l.discord_id,
                description: `عرض طلبات التوكيل الخاصة بـ ${l.lawyer_name}`,
                emoji: '⚖️',
            }))
        );

    return {
        embeds: [embed],
        components: [
            new ActionRowBuilder().addComponents(menu),
            resetRow('محامي'),
        ],
    };
}

/* ─── لوحة محامي بعينه: طلباته + أزرار القبول/الرفض ─── */
async function buildDashboard(db, lawyerId, lawyerName) {
    const requests = await db.getLawyerRequests(lawyerId);
    const img      = await db.getImage('محاماة');

    const embed = new EmbedBuilder()
        .setTitle('⚖️ لوحة المحامي')
        .setColor(0x1B5E20)
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
