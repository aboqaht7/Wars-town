const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');
const { resetRow } = require('../utils');

const RETAINER_FEE = 5000;
const ATAB_FEE     = 10000;

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
        const channelId = await db.getConfig('lawyer_tasks_channel');
        const target = (channelId && message.guild.channels.cache.get(channelId)) || message.channel;
        target.send(await build(db, message.author.id, lawyer.lawyer_name));
    },

    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const allLawyers = await db.getLawyers();
        const lawyer = allLawyers.find(l => l.discord_id === interaction.user.id);
        if (!lawyer)
            return interaction.reply({ content: '❌ أنت لست مسجلاً كمحامٍ معتمد.', flags: 64 });

        const channelId = await db.getConfig('lawyer_tasks_channel');
        const target = (channelId && interaction.guild.channels.cache.get(channelId)) || interaction.channel;

        await target.send(await build(db, interaction.user.id, lawyer.lawyer_name));
        await interaction.reply({ content: '\u200b', flags: 64 });
    },
};

module.exports.buildTasks = build;
module.exports.RETAINER_FEE = RETAINER_FEE;
module.exports.ATAB_FEE     = ATAB_FEE;

async function build(db, lawyerId, lawyerName) {
    const requests     = await db.getLawyerRequests(lawyerId);
    const activeCases  = await db.getCasesByLawyer(lawyerId);
    const img          = await db.getImage('محاماة');

    const embed = new EmbedBuilder()
        .setTitle('📋 مهام المحامي')
        .setColor(0x0D47A1)
        .setAuthor({ name: `المحامي: ${lawyerName}` })
        .setFooter({ text: `بدل التوكيل الثابت: ${RETAINER_FEE.toLocaleString()} ريال • نظام المحاماة • بوت FANTASY` })
        .setTimestamp();

    if (img) embed.setThumbnail(img);

    const components = [];

    /* ── قسم 1: طلبات التوكيل المعلقة ── */
    if (requests.length) {
        embed.addFields({
            name: `📬 طلبات التوكيل المعلقة (${requests.length})`,
            value: requests.slice(0, 8).map((r, i) =>
                `**${i + 1}.** 📁 ${r.case_number} — ${r.case_title}\n` +
                `> 👤 الموكّل: **${r.plaintiff_name}** (<@${r.plaintiff_id}>)\n` +
                `> 💰 بدل التوكيل: **${RETAINER_FEE.toLocaleString()} ريال** (يُخصم تلقائياً عند القبول)`
            ).join('\n\n'),
            inline: false,
        });

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
    } else {
        embed.addFields({
            name: '📬 طلبات التوكيل المعلقة',
            value: '> 📭 لا توجد طلبات معلقة حالياً',
            inline: false,
        });
    }

    /* ── قسم 2: القضايا الجارية مع زر الأتعاب ── */
    if (activeCases.length) {
        const now = Date.now();
        const DAYS_REQUIRED = 15;

        const caseLines = activeCases.slice(0, 6).map((c, i) => {
            const assignedAt = c.lawyer_assigned_at ? new Date(c.lawyer_assigned_at).getTime() : null;
            const daysPassed = assignedAt ? Math.floor((now - assignedAt) / 86_400_000) : null;
            const eligible   = daysPassed !== null && daysPassed >= DAYS_REQUIRED;
            const daysLeft   = daysPassed !== null ? Math.max(0, DAYS_REQUIRED - daysPassed) : DAYS_REQUIRED;

            return (
                `**${i + 1}.** 📁 ${c.case_number} — ${c.title}\n` +
                `> 👤 الموكّل: **${c.plaintiff_name}** • الحالة: **${db.CASE_STATUS?.[c.status] || c.status}**\n` +
                (eligible
                    ? `> ✅ مضى ${daysPassed} يوماً — يحق لك المطالبة بالأتعاب`
                    : `> ⏳ يتبقى **${daysLeft} يوم** لاستحقاق الأتعاب`)
            );
        });

        embed.addFields({
            name: `⚖️ قضاياي الجارية (${activeCases.length})`,
            value: caseLines.join('\n\n'),
            inline: false,
        });

        embed.addFields({
            name: '💼 حق الأتعاب',
            value: `> بعد مرور **${DAYS_REQUIRED} يوماً** على القضية يحق لك طلب **${ATAB_FEE.toLocaleString()} ريال** أتعاباً إضافية`,
            inline: false,
        });

        for (const c of activeCases.slice(0, 3)) {
            const assignedAt = c.lawyer_assigned_at ? new Date(c.lawyer_assigned_at).getTime() : null;
            const daysPassed = assignedAt ? Math.floor((now - assignedAt) / 86_400_000) : 0;
            const eligible   = daysPassed >= DAYS_REQUIRED;

            components.push(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`lawyer_atab_${c.id}`)
                        .setLabel(eligible
                            ? `💰 طلب أتعاب ${ATAB_FEE.toLocaleString()} — ${c.case_number}`
                            : `⏳ الأتعاب بعد ${DAYS_REQUIRED - daysPassed} يوم — ${c.case_number}`)
                        .setStyle(eligible ? ButtonStyle.Primary : ButtonStyle.Secondary)
                        .setDisabled(!eligible),
                )
            );
        }
    }

    components.push(resetRow('مهام-محامي'));
    return { embeds: [embed], components };
}
