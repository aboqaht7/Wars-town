const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: 'تراكينق',
    data: new SlashCommandBuilder()
        .setName('تراكينق')
        .setDescription('بدء عملية تراكينق على هدف (لأعضاء CIA فقط)')
        .addStringOption(o =>
            o.setName('النوع')
             .setDescription('نوع التراكينق')
             .setRequired(false)
             .addChoices(
                 { name: 'عادي (لمواطن)',     value: 'normal'    },
                 { name: 'للرؤساء (محدود)', value: 'president' },
             )
        ),

    async slashExecute(interaction, db) {
        const ciaRoleId = await db.getConfig('cia_chef_role');
        if (!ciaRoleId) {
            return interaction.reply({ content: '⚠️ لم يتم تعيين رتبة CIA بعد. على الأدمن استخدام `/تعيين-رتبة-cia` أولاً.', flags: 64 });
        }
        if (!interaction.member.roles.cache.has(ciaRoleId)) {
            return interaction.reply({ content: '❌ هذا الأمر لأعضاء CIA فقط.', flags: 64 });
        }

        const type = interaction.options.getString('النوع') || 'normal';
        const modalId = type === 'president' ? 'tracking_president_modal' : 'tracking_modal';
        const title   = type === 'president' ? 'تراكينق للرؤساء'        : 'تراكينق';

        const modal = new ModalBuilder()
            .setCustomId(modalId)
            .setTitle(title);

        const input = new TextInputBuilder()
            .setCustomId('tracking_target')
            .setLabel('منشن أو معرّف الهدف')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('@username أو 123456789')
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    },
};
