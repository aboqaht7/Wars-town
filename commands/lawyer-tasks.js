const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder,
} = require('discord.js');
const { resetRow } = require('../utils');
const { loadEmbedCfg, applyEmbed } = require('../embedConfig');

const RETAINER_FEE  = 5000;
const ATAB_FEE      = 10000;
const ABANDON_FEE   = RETAINER_FEE / 2;

module.exports = {
    name: 'مهام-محامي',
    data: new SlashCommandBuilder()
        .setName('مهام-محامي')
        .setDescription('⚖️ Lawyer Tasks Board — choose your name from the list'),

    async execute(message, args, db) {
        const channelId = await db.getConfig('lawyer_tasks_channel');
        const target = (channelId && message.guild.channels.cache.get(channelId)) || message.channel;
        target.send(await buildMain(db));
    },

    async slashExecute(interaction, db) {
        const main = await buildMain(db);
        if (interaction._isReset) return interaction.message.edit(main);
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

async function buildMain(db) {
    const allLawyers = await db.getLawyers();
    const img = await db.getImage('محاماة');
    const cfg = await loadEmbedCfg(db, 'lawyer_tasks');

    const embed = new EmbedBuilder().setColor(0xE53935).setTimestamp();
    applyEmbed(embed, cfg);

    if (img) embed.setThumbnail(img);

    if (!allLawyers.length) {
        embed.setDescription('> 📭 No lawyers registered currently.');
        return { embeds: [embed], components: [resetRow('مهام-محامي')] };
    }

    const menu = new StringSelectMenuBuilder()
        .setCustomId('lawyer_tasks_select')
        .setPlaceholder(cfg.placeholder || 'Choose your name...')
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

async function buildPrivate(db, lawyerId, lawyerName) {
    const requests    = await db.getLawyerRequests(lawyerId);
    const activeCases = await db.getCasesByLawyer(lawyerId);
    const img         = await db.getImage('محاماة');

    const embed = new EmbedBuilder()
        .setTitle('My Tasks Board')
        .setColor(0xE53935)
        .setFooter({ text: `Retainer Fee: ${RETAINER_FEE.toLocaleString()} Riyals • Law System • FANTASY Bot` })
        .setTimestamp();

    if (img) embed.setThumbnail(img);

    const components = [];

    if (requests.length) {
        embed.addFields({
            name: `📬 Pending Retainer Requests (${requests.length})`,
            value: requests.slice(0, 8).map((r, i) =>
                `**${i + 1}.** 📁 ${r.case_number} — ${r.case_title}\n` +
                `> 💰 Retainer Fee: **${RETAINER_FEE.toLocaleString()} Riyals** (deducted automatically upon acceptance)`
            ).join('\n\n'),
            inline: false,
        });

        for (const r of requests.slice(0, 4)) {
            components.push(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`lawyer_req_accept_${r.id}`)
                        .setLabel(`Accept — ${r.case_number}`).setEmoji('✅')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`lawyer_req_reject_${r.id}`)
                        .setLabel(`Reject — ${r.case_number}`).setEmoji('❌')
                        .setStyle(ButtonStyle.Danger),
                )
            );
        }
    } else {
        embed.addFields({
            name: '📬 Pending Retainer Requests',
            value: '> 📭 No pending requests currently',
            inline: false,
        });
    }

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
                `> Status: **${db.CASE_STATUS?.[c.status] || c.status}**\n` +
                (eligible
                    ? `> ✅ ${daysPassed} days elapsed — you can claim your fees`
                    : `> ⏳ **${daysLeft} day(s)** remaining until fees are due`)
            );
        });

        embed.addFields(
            {
                name: `⚖️ My Ongoing Cases (${activeCases.length})`,
                value: caseLines.join('\n\n'),
                inline: false,
            },
            {
                name: '💼 Attorney Fees',
                value: `> After **${DAYS_REQUIRED} days** on a case you can request **${ATAB_FEE.toLocaleString()} Riyals** in additional fees`,
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
                            ? `💰 Fees ${ATAB_FEE.toLocaleString()} — ${c.case_number}`
                            : `⏳ Fees in ${DAYS_REQUIRED - daysPassed}d — ${c.case_number}`)
                        .setStyle(eligible ? ButtonStyle.Primary : ButtonStyle.Secondary)
                        .setDisabled(!eligible),
                    new ButtonBuilder()
                        .setCustomId(`lawyer_abandon_${c.id}`)
                        .setLabel(`Abandon — ${c.case_number}`).setEmoji('🚫')
                        .setStyle(ButtonStyle.Danger),
                )
            );
        }
    }

    return { embeds: [embed], components };
}
