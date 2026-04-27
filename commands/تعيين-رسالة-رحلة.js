const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: 'تعيين-رسالة-رحلة',
    data: new SlashCommandBuilder()
        .setName('تعيين-رسالة-رحلة')
        .setDescription('Set the text for trip start, Hurricane, or Renew messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt =>
            opt.setName('النوع')
                .setDescription('Message type')
                .setRequired(true)
                .addChoices(
                    { name: '✈️ Trip Start',  value: 'trip_start' },
                    { name: '🌪️ Hurricane',   value: 'trip_hurricane' },
                    { name: '🔄 Renew',       value: 'trip_renewal' },
                )
        ),

    async slashExecute(interaction, db) {
        const type = interaction.options.getString('النوع');
        const titles = {
            trip_start:    'Trip Start Message',
            trip_hurricane:'Hurricane Message',
            trip_renewal:  'Renew Message'
        };

        const modal = new ModalBuilder()
            .setCustomId(`set_trip_msg_${type}`)
            .setTitle(titles[type]);

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('trip_msg_text')
                    .setLabel('Text to be sent')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setMaxLength(2000)
                    .setPlaceholder('Write the full message exactly as you want it to appear')
            ),
        );

        await interaction.showModal(modal);
    }
};
