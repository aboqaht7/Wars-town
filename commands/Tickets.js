const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');
const { resetRow } = require('../utils');
const { parseEmoji } = require('../btnConfig');

module.exports = {
    name: 'tickets',
    data: new SlashCommandBuilder()
        .setName('tickets')
        .setDescription('Ticket System'),

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
    }
};

async function build(db) {
    const types = await db.getTicketTypes();
    const img   = await db.getImage('tickets').catch(() => null);

    const embed = new EmbedBuilder()
        .setTitle('Ticket System')
        .setColor(0x1565C0)
        .setFooter({ text: 'Ticket System • FANTASY Bot' })
        .setTimestamp();
    if (img) embed.setImage(img);

    if (!types.length) {
        embed.setDescription('> No ticket types available. Wait for the admin.');
        return { embeds: [embed], components: [resetRow('tickets')] };
    }

    embed.setDescription('Choose the ticket type from the menu below and a private channel will be created for you.');

    const options = types.slice(0, 25).map(t => {
        const opt = new StringSelectMenuOptionBuilder()
            .setLabel(t.name || 'تكت')
            .setValue(String(t.id))
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
            .addOptions(options)
    );

    return { embeds: [embed], components: [menuRow, resetRow('tickets')] };
}
