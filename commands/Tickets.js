const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'tickets',
    data: new SlashCommandBuilder()
        .setName('tickets')
        .setDescription('نظام التكتات: فتح تكت جديد'),
    execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('نظام التكتات')
            .setDescription('اكتب: `-ticket نوع الغرض رابط_الصورة`')
            .setColor('Red');
        message.channel.send({ embeds: [embed] });
    },
    slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('نظام التكتات')
            .setDescription('اختر نوع التكت والغرض')
            .setColor('Red');

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('ticket_menu')
                .setPlaceholder('اختر نوع التكت')
                .addOptions([
                    { label: 'شكوى', value: 'complaint' },
                    { label: 'اقتراح', value: 'suggestion' },
                    { label: 'بلاغ', value: 'report' },
                    { label: 'استفسار', value: 'inquiry' }
                ])
        );

        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
