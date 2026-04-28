const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'الرحلات',
    data: new SlashCommandBuilder()
        .setName('الرحلات')
        .setDescription('Trip System'),

    async execute(message, args, db) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('❌ This command is for admins only.');
        const payload = await build(db);
        message.channel.send(payload);
    },

    async slashExecute(interaction, db) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: '❌ This command is for admins only.', flags: 64 });
        const payload = await build(db);
        if (interaction._isReset) return interaction.message.edit(payload);
        await interaction.channel.send(payload);
        await interaction.reply({ content: '​', flags: 64 });
    }
};

async function build(db) {
    const embed = new EmbedBuilder()
        .setTitle('Trip System')
        .setColor(0xB71C1C)
        .setDescription(
            '> Choose the required action from the buttons below.\n\n' +
            '✈️ **Start Trip** — Open a new trip and send the notification\n' +
            '🌪️ **Hurricane** — End the trip and send the hurricane warning\n' +
            '🔄 **Renew** — Renew a trip with the host ID\n' +
            '📣 **Alert** — Send a custom alert to the alerts channel'
        )
        .setFooter({ text: 'Trip System • FANTASY Bot' })
        .setTimestamp();

    const img = await db.getImage('الرحلات');
    if (img) embed.setImage(img);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('trip_start').setLabel('Start Trip').setStyle(ButtonStyle.Success).setEmoji('✈️'),
        new ButtonBuilder().setCustomId('trip_hurricane').setLabel('Hurricane').setStyle(ButtonStyle.Danger).setEmoji('🌪️'),
        new ButtonBuilder().setCustomId('trip_renewal').setLabel('Renew').setStyle(ButtonStyle.Primary).setEmoji({ id: '1479212270746599528', name: 'GL137', animated: true }),
        new ButtonBuilder().setCustomId('trip_alert').setLabel('Alert').setStyle(ButtonStyle.Secondary).setEmoji('📣'),
    );

    return { embeds: [embed], components: [row] };
}
