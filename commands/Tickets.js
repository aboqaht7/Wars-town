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
        embed.setDescription('> No ticket types available yet.');
        return { embeds: [embed], components: [resetRow('tickets')] };
    }

    embed.setDescription('Select the ticket type below and a private channel will be opened for you.');

    const options = types.slice(0, 24).map(t => {
        const opt = new StringSelectMenuOptionBuilder()
            .setLabel(t.name || 'Ticket')
            .setValue((t.name || String(t.id)).slice(0, 100))
            .setDescription(t.role_id ? 'Handled by a dedicated team' : 'Click to open');
        if (t.emoji) {
            const parsed = parseEmoji(t.emoji);
            if (parsed) {
                try {
                    opt.setEmoji(typeof parsed === 'string' ? { name: parsed } : parsed);
                } catch (_) {}
            }
        }
        return opt;
    });

    const menuRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('tickets_type_menu')
            .setPlaceholder('🎫 Choose a ticket type')
            .addOptions([...options, resetOption('tickets')])
    );

    return { embeds: [embed], components: [menuRow] };
}

module.exports = {
    name: 'tickets',
    buildPanel: build,
    data: new SlashCommandBuilder()
        .setName('tickets')
        .setDescription('Open the ticket system panel'),

    async execute(message, args, db) {
        const payload = await build(db);
        await message.channel.send(payload);
    },

    async slashExecute(interaction, db) {
        if (interaction._isReset) {
            const payload = await build(db);
            return interaction.message.edit(payload);
        }
        try { await interaction.deferReply({ flags: 64 }); } catch { return; }
        const payload = await build(db);
        await interaction.channel.send(payload);
        await interaction.deleteReply().catch(() => {});
    },
};
