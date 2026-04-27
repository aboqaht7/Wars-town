const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} = require('discord.js');
const { resetRow, resetOption } = require('../utils');
const { parseEmoji } = require('../btnConfig');

async function build(db) {
    const types = await db.getTicketTypes();
    const img   = await db.getImage('tickets').catch(() => null);

    const embed = new EmbedBuilder()
        .setTitle('🎫 Ticket System')
        .setColor(0x1565C0)
        .setFooter({ text: 'Ticket System • FANTASY Bot' })
        .setTimestamp();
    if (img) embed.setImage(img);

    if (!types.length) {
        embed.setDescription('> لا توجد أنواع تكتات حالياً.');
        return { embeds: [embed], components: [resetRow('tickets')] };
    }

    embed.setDescription('اختر نوع التكت من القائمة أدناه وسيُفتح لك روم خاص.');

    const options = types.slice(0, 24).map(t => {
        const opt = new StringSelectMenuOptionBuilder()
            .setLabel(t.name || 'Ticket')
            .setValue((t.name || String(t.id)).slice(0, 100))
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
            .setCustomId('tickets_type_menu')
            .setPlaceholder('🎫 اختر نوع التكت')
            .addOptions([...options, resetOption('tickets')])
    );

    return { embeds: [embed], components: [menuRow] };
}

/**
 * Send or update the single panel for this channel.
 * - If a saved message ID exists and the message is still there → edit it.
 * - Otherwise → send a new message and save its ID.
 */
async function sendOrUpdatePanel(channel, db) {
    const configKey  = `ticket_panel_msg_${channel.id}`;
    const savedMsgId = await db.getConfig(configKey).catch(() => null);
    const payload    = await build(db);

    if (savedMsgId) {
        try {
            const existing = await channel.messages.fetch(savedMsgId);
            await existing.edit(payload);
            return existing;
        } catch (_) {
            // Message was deleted — fall through to send a new one
        }
    }

    const msg = await channel.send(payload);
    await db.setConfig(configKey, msg.id);
    return msg;
}

module.exports = {
    name: 'tickets',
    buildPanel: build,
    sendOrUpdatePanel,

    data: new SlashCommandBuilder()
        .setName('tickets')
        .setDescription('Open the ticket system panel'),

    async execute(message, args, db) {
        await sendOrUpdatePanel(message.channel, db);
    },

    async slashExecute(interaction, db) {
        // Reset button: just rebuild and edit the current message
        if (interaction._isReset) {
            const payload = await build(db);
            return interaction.message.edit(payload);
        }

        try { await interaction.deferReply({ flags: 64 }); } catch { return; }
        await sendOrUpdatePanel(interaction.channel, db);
        await interaction.deleteReply().catch(() => {});
    },
};
