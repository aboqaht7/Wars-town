const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'identity',
    data: new SlashCommandBuilder()
        .setName('identity')
        .setDescription('عرض الهوية'),
        m.execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('الهوية')
            .setDescription('شخصيتك الحالية')
            .setColor('Red')
            .setImage(db.get('identity_image') || '');
        message.channel.send({ embeds: [embed] });
    },
    slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('الهوية')
            .setDescription('شخصيتك الحالية')
            .setColor('Red')
            .setImage(db.get('identity_image') || '');

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('identity_menu')
                .setPlaceholder('اختر شخصية')
                .addOptions([
                    { label: 'شخصية 1', value: 'char1' },
                    { label: 'شخصية 2', value: 'char2' },
                    { label: 'شخصية 3 (مقفلة)', value: 'char3' },
                    { label: 'شخصية 4 (مقفلة)', value: 'char4' }
                ])
        );

        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
