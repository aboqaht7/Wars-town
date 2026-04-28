const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const { parseEmoji } = require('../btnConfig');

/* ── بناء الـ Payload ─────────────────────────────────────────────────────── */
async function buildPayload(db) {
    const types = await db.getTicketTypes().catch(() => []);
    const img   = await db.getImage('tickets').catch(() => null);

    const embed = new EmbedBuilder()
        .setTitle('🎫 نظام التكتات')
        .setColor(0x1565C0)
        .setFooter({ text: 'FANTASY Bot • Ticket System' })
        .setTimestamp();
    if (img) embed.setImage(img);

    const resetBtn = new ButtonBuilder()
        .setCustomId('reset_tickets')
        .setLabel('🔄 Reset Menu')
        .setStyle(ButtonStyle.Secondary);
    const resetRow = new ActionRowBuilder().addComponents(resetBtn);

    if (!types.length) {
        embed.setDescription('> لا توجد أنواع تكتات حالياً.\n> استخدم `/إعداد-تكتات إضافة-نوع` لإضافة نوع.');
        return { embeds: [embed], components: [resetRow] };
    }

    embed.setDescription('اختر نوع التكت من القائمة أدناه وسيُفتح لك روم خاص.');

    const options = types.slice(0, 24).map(t => {
        const opt = new StringSelectMenuOptionBuilder()
            .setLabel(t.name || 'Ticket')
            .setValue(String(t.id))
            .setDescription(t.role_id ? 'يتولاه فريق مخصص' : 'اضغط للفتح');
        if (t.emoji) {
            const parsed = parseEmoji(t.emoji);
            if (parsed) {
                try { opt.setEmoji(typeof parsed === 'string' ? { name: parsed } : parsed); } catch (_) {}
            }
        }
        return opt;
    });

    const menuRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('open_ticket_select')
            .setPlaceholder('🎫 اختر نوع التكت')
            .addOptions(options)
    );

    return { embeds: [embed], components: [menuRow, resetRow] };
}

/* ── إرسال أو تعديل البانل (بانل واحد فقط لكل قناة) ─────────────────────── */
async function sendOrUpdate(channel, db) {
    const key      = `ticket_panel_${channel.id}`;
    const savedId  = await db.getConfig(key).catch(() => null);
    const payload  = await buildPayload(db);

    if (savedId) {
        try {
            const msg = await channel.messages.fetch(savedId);
            await msg.edit(payload);
            return msg;
        } catch (_) { /* الرسالة حُذفت — نرسل جديدة */ }
    }

    const msg = await channel.send(payload);
    await db.setConfig(key, msg.id).catch(() => {});
    return msg;
}

module.exports = {
    name: 'tickets',
    buildPayload,
    sendOrUpdate,

    data: new SlashCommandBuilder()
        .setName('tickets')
        .setDescription('عرض بانل التكتات'),

    async execute(message, _args, db) {
        await sendOrUpdate(message.channel, db);
    },

    async slashExecute(interaction, db) {
        // Reset button pressed on an existing panel → edit in place
        if (interaction._isReset) {
            const payload = await buildPayload(db);
            await interaction.message.edit(payload).catch(() => {});
            await db.setConfig(`ticket_panel_${interaction.channel.id}`, interaction.message.id).catch(() => {});
            return;
        }
        try { await interaction.deferReply({ flags: 64 }); } catch { return; }
        await sendOrUpdate(interaction.channel, db);
        await interaction.deleteReply().catch(() => {});
    },
};
