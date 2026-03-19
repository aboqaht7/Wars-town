const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'tickets',
    data: new SlashCommandBuilder()
        .setName('tickets')
        .setDescription('نظام التكتات'),

    async execute(message, args, db) {
        const payload = await build(db);
        message.channel.send(payload);
    },

    async slashExecute(interaction, db) {
        const payload = await build(db);
        if (interaction._isReset) return interaction.message.edit(payload);
        await interaction.channel.send(payload);
        await interaction.reply({ content: '​', flags: 64 });
    }
};

async function build(db) {
    const types = await db.getTicketTypes();

    const embed = new EmbedBuilder()
        .setTitle('🎫 نظام التكتات')
        .setColor(0x1565C0)
        .setFooter({ text: 'نظام التكتات • بوت FANTASY' })
        .setTimestamp();

    const img = await db.getImage('tickets').catch(() => null);
    if (img) embed.setImage(img);

    if (!types.length) {
        embed.setDescription('> لا توجد أنواع تكتات متاحة حالياً. انتظر الإدارة.');
        return { embeds: [embed], components: [resetRow('tickets')] };
    }

    embed.setDescription('اضغط على نوع التكت الذي تريد فتحه وسيُنشأ لك روم خاص.');

    const rows = [];
    let currentRow = new ActionRowBuilder();
    let count = 0;

    for (const type of types) {
        if (count > 0 && count % 5 === 0) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
        }
        currentRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`open_ticket_${type.id}`)
                .setLabel(`${type.emoji} ${type.name}`)
                .setStyle(ButtonStyle.Primary)
        );
        count++;
        if (rows.length >= 4) break;
    }
    if (currentRow.components.length > 0) rows.push(currentRow);
    rows.push(resetRow('tickets'));

    return { embeds: [embed], components: rows };
}
