const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder,
} = require('discord.js');
const { resetRow } = require('../utils');

const RETAINER_FEE  = 5000;
const ATAB_FEE      = 10000;
const ABANDON_FEE   = RETAINER_FEE / 2;   // 2500 — نصف بدل التوكيل يُردّ للموكّل

module.exports = {
    name: 'مهام-محامي',
    data: new SlashCommandBuilder()
        .setName('مهام-محامي')
        .setDescription('⚖️ لوحة مهام المحامين — اختر اسمك من القائمة'),

    async execute(message, args, db) {
        const channelId = await db.getConfig('lawyer_tasks_channel');
        const target = (channelId && message.guild.channels.cache.get(channelId)) || message.channel;
        target.send(await buildMain(db));
    },

    async slashExecute(interaction, db) {
        const main = await buildMain(db);
        // جاء من زر Reset → عدّل الرسالة الحالية مباشرةً
        if (interaction._isReset) return interaction.message.edit(main);
        // طلب slash عادي → أرسل للروم المحدد
        const channelId = await db.getConfig('lawyer_tasks_channel');
        const target = (channelId && interaction.guild.channels.cache.get(channelId)) || interaction.channel;
        await target.send(main);
        await interaction.reply({ content: '\u200b', flags: 64 });
    },
};

module.exports.buildMain    = buildMain;
module.exports.buildTasks   = buildPrivate;
module.exports.RETAINER_FEE = RETAINER_FEE;
module.exports.ATAB_FEE     = ATAB_FEE;
module.exports.ABANDON_FEE  = ABANDON_FEE;

// ─── اللوحة العامة (بدون أي معلومات شخصية) ─────────────────────────────────
async function buildMain(db) {
    const allLawyers = await db.getLawyers();
    const img = await db.getImage('محاماة');

    const embed = new EmbedBuilder()
        .setTitle('⚖️ مهام المحامين')
        .setColor(0x0D47A1)
        .setDescription(
            '> اختر اسمك من القائمة أدناه للوصول إلى لوحة مهامك الخاصة.\n' +
            '> لا يمكن لأي محامٍ الدخول على لوحة محامٍ آخر.'
        )
        .setFooter({ text: 'نظام المحاماة • بوت FANTASY' })
        .setTimestamp();

    if (img) embed.setThumbnail(img);

    if (!allLawyers.length) {
        embed.setDescription('> 📭 لا يوجد محامون مسجلون حالياً.');
        return { embeds: [embed], components: [resetRow('مهام-محامي')] };
    }

    const menu = new StringSelectMenuBuilder()
        .setCustomId('lawyer_tasks_select')
        .setPlaceholder('اختر اسمك...')
        .addOptions(allLawyers.map(l => ({
            label: l.lawyer_name,
            value: l.discord_id,
        })));

    return {
        embeds: [embed],
        components: [
            new ActionRowBuilder().addComponents(menu),
            resetRow('مهام-محامي'),
        ],
    };
}

// ─── اللوحة الخاصة بالمحامي (ephemeral) ─────────────────────────────────────
async function buildPrivate(db, lawyerId, lawyerName) {
    const requests    = await db.getLawyerRequests(lawyerId);
    const activeCases = await db.getCasesByLawyer(lawyerId);
    const img         = await db.getImage('محاماة');

    const embed = new EmbedBuilder()
        .setTitle('📋 لوحة مهامي')
        .setColor(0x0D47A1)
        .setFooter({ text: `بدل التوكيل: ${RETAINER_FEE.toLocaleString()} ريال • نظام المحاماة • بوت FANTASY` })
        .setTimestamp();

    if (img) embed.setThumbnail(img);

    const components = [];

    /* ── قسم 1: طلبات التوكيل المعلقة ── */
    if (requests.length) {
        embed.addFields({
            name: `📬 طلبات التوكيل المعلقة (${requests.length})`,
            value: requests.slice(0, 8).map((r, i) =>
                `**${i + 1}.** 📁 ${r.case_number} — ${r.case_title}\n` +
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
                `> الحالة: **${db.CASE_STATUS?.[c.status] || c.status}**\n` +
                (eligible
                    ? `> ✅ مضى ${daysPassed} يوماً — يحق لك المطالبة بالأتعاب`
                    : `> ⏳ يتبقى **${daysLeft} يوم** لاستحقاق الأتعاب`)
            );
        });

        embed.addFields(
            {
                name: `⚖️ قضاياي الجارية (${activeCases.length})`,
                value: caseLines.join('\n\n'),
                inline: false,
            },
            {
                name: '💼 حق الأتعاب',
                value: `> بعد مرور **${DAYS_REQUIRED} يوماً** على القضية يحق لك طلب **${ATAB_FEE.toLocaleString()} ريال** أتعاباً إضافية`,
                inline: false,
            }
        );

        for (const c of activeCases.slice(0, 3)) {
            const assignedAt = c.lawyer_assigned_at ? new Date(c.lawyer_assigned_at).getTime() : null;
            const daysPassed = assignedAt ? Math.floor((now - assignedAt) / 86_400_000) : 0;
            const eligible   = daysPassed >= DAYS_REQUIRED;

            components.push(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`lawyer_atab_${c.id}`)
                        .setLabel(eligible
                            ? `💰 أتعاب ${ATAB_FEE.toLocaleString()} — ${c.case_number}`
                            : `⏳ أتعاب بعد ${DAYS_REQUIRED - daysPassed}ي — ${c.case_number}`)
                        .setStyle(eligible ? ButtonStyle.Primary : ButtonStyle.Secondary)
                        .setDisabled(!eligible),
                    new ButtonBuilder()
                        .setCustomId(`lawyer_abandon_${c.id}`)
                        .setLabel(`🚫 تخلٍّ — ${c.case_number}`)
                        .setStyle(ButtonStyle.Danger),
                )
            );
        }
    }

    return { embeds: [embed], components };
}
