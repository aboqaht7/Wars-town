const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: 'أولوية-إضافة-زر',
    data: new SlashCommandBuilder()
        .setName('أولوية-إضافة-زر')
        .setDescription('إضافة زر جديد لنظام الأولوية')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt =>
            opt.setName('اسم-الزر')
                .setDescription('النص الظاهر على الزر')
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('اللون')
                .setDescription('لون الزر')
                .setRequired(true)
                .addChoices(
                    { name: '🔵 أزرق', value: 'Primary' },
                    { name: '⚫ رمادي', value: 'Secondary' },
                    { name: '🟢 أخضر', value: 'Success' },
                    { name: '🔴 أحمر', value: 'Danger' },
                )
        ),

    async slashExecute(interaction, db) {
        const label = interaction.options.getString('اسم-الزر');
        const style = interaction.options.getString('اللون');

        const modal = new ModalBuilder()
            .setCustomId(`priority_add_modal_${style}`)
            .setTitle(`Button: ${label.slice(0, 30)}`);

        const textInput = new TextInputBuilder()
            .setCustomId('priority_text')
            .setLabel('Text sent when the button is pressed')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(2000);

        const labelInput = new TextInputBuilder()
            .setCustomId('priority_label')
            .setLabel('Button name (do not change)')
            .setStyle(TextInputStyle.Short)
            .setValue(label)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(labelInput),
            new ActionRowBuilder().addComponents(textInput),
        );

        await interaction.showModal(modal);
    }
};
