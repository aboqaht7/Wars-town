const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'tickets',
    data: new SlashCommandBuilder()
        .setName('tickets')
        .setDescription('نظام التكتات'),

    async execute(message, args, db) {
        const payload = await build(db);
        await message.channel.send(payload);
    },

    async slashExecute(interaction, db) {
        if (interaction._isReset) {
            const payload = await build(db);
            return interaction.message.edit(payload);
        }
        await interaction.deferReply({ flags: 64 });
        const payload = await build(db);
        await interaction.channel.send(payload);
        await interaction.deleteReply().catch(() => {});
    }
};

async function build(db) {
    const types = await db.getTicketTypes();
    const img   = await db.getImage('tickets').catch(() => null);

    const embed = new EmbedBuilder()
        .setTitle('🎫 نظام التكتات')
        .setColor(0x1565C0)
        .setFooter({ text: 'نظام التكتات • بوت FANTASY' })
        .setTimestamp();
    if (img) embed.setImage(img);

    if (!types.length) {
        embed.setDescription('> لا توجد أنواع تكتات متاحة حالياً. انتظر الإدارة.');
        return { embeds: [embed], components: [resetRow('tickets')] };
    }

    embed.setDescription('اختر نوع التكت من القائمة أدناه وسيُنشأ لك روم خاص.');

    const options = types.slice(0, 25).map(t => ({
        label: `${t.emoji} ${t.name}`,
        value: String(t.id),
        description: t.role_id ? 'يستلمه فريق مخصص' : 'انقر للفتح',
    }));

    const menuRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('tickets_type_menu')
            .setPlaceholder('🎫 اختر نوع التكت')
            .addOptions(options)
    );

    return { embeds: [embed], components: [menuRow, resetRow('tickets')] };
}
