const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'بانيك',
    data: new SlashCommandBuilder()
        .setName('بانيك')
        .setDescription('Send a distress call embed in this channel'),

    async slashExecute(interaction, db) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ You do not have permission.', flags: 64 });

        const panicChannel = await db.getConfig('panic_channel');
        if (!panicChannel)
            return interaction.reply({ content: '❌ Panic channel has not been set yet. Use `/إعداد-بانيك` first.', flags: 64 });

        const _img = await db.getImage('events').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('Panic — Distress Call')
            .setColor(0xD32F2F)
            .setDescription(
                '**Are you in danger?**\n\n' +
                'Press the button below, enter your location, and the distress request will immediately reach the relevant authorities.\n\n' +
                '> ⚠️ This system is for emergency situations only.'
            )
            .setFooter({ text: 'Panic System • FANTASY Bot' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('panic_location_btn')
                .setLabel('Send Location').setEmoji('📍')
                .setStyle(ButtonStyle.Danger)
        );

        if (_img) embed.setImage(_img);
        await interaction.channel.send({ embeds: [embed], components: [row] });
        return interaction.reply({ content: '✅ Panic embed sent.', flags: 64 });
    },
};
