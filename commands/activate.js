const { SlashCommandBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    name: 'تفعيل',
    data: new SlashCommandBuilder()
        .setName('تفعيل')
        .setDescription('تقديم طلب تفعيل الحساب بإدخال ID سوني الخاص بك'),

    async slashExecute(interaction, db) {
        const modal = new ModalBuilder()
            .setCustomId('activation_sony_modal')
            .setTitle('🎮 طلب تفعيل الحساب');

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('sony_id')
                    .setLabel('ادخل ID سوني الخاص بك (PSN)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('مثال: PlayerName123')
                    .setRequired(true)
                    .setMinLength(3)
                    .setMaxLength(50)
            )
        );

        return interaction.showModal(modal);
    },
};
