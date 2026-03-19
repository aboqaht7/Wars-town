const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: 'تعيين-رسالة-رحلة',
    data: new SlashCommandBuilder()
        .setName('تعيين-رسالة-رحلة')
        .setDescription('تحديد نص رسالة بدء الرحلة أو الإعصار أو التجديد')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt =>
            opt.setName('النوع')
                .setDescription('نوع الرسالة')
                .setRequired(true)
                .addChoices(
                    { name: '✈️ بدء الرحلة', value: 'trip_start' },
                    { name: '🌪️ الإعصار', value: 'trip_hurricane' },
                    { name: '🔄 التجديد', value: 'trip_renewal' },
                )
        ),

    async slashExecute(interaction, db) {
        const type = interaction.options.getString('النوع');
        const titles = { trip_start: 'رسالة بدء الرحلة', trip_hurricane: 'رسالة الإعصار', trip_renewal: 'رسالة التجديد' };

        const modal = new ModalBuilder()
            .setCustomId(`set_trip_msg_${type}`)
            .setTitle(titles[type]);

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('trip_msg_text')
                    .setLabel('النص الذي سيُرسل')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setMaxLength(2000)
                    .setPlaceholder('اكتب الرسالة كاملة كما تريدها أن تظهر')
            ),
        );

        await interaction.showModal(modal);
    }
};
