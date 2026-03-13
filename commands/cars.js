const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'cars',
    data: new SlashCommandBuilder()
        .setName('cars')
        .setDescription('عرض معرض السيارات'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('معرض السيارات')
            .setDescription('كل السيارات المتاحة للبيع والمزاد')
            .setColor('Red')
            .setImage(await db.get('cars_image') || '');

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('cars_menu')
                .setPlaceholder('اختر السيارة')
                .addOptions([
                    { label: 'تويوتا', value: 'toyota' },
                    { label: 'مرسيدس', value: 'mercedes' },
                    { label: 'بي إم دبليو', value: 'bmw' },
                    { label: 'لكزس', value: 'lexus' },
                    { label: 'مزاد السيارات', value: 'auction' }
                ])
        );

        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('معرض السيارات')
            .setDescription('كل السيارات المتاحة للبيع والمزاد')
            .setColor('Red')
            .setImage(await db.get('cars_image') || '');

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('cars_menu')
                .setPlaceholder('اختر السيارة')
                .addOptions([
                    { label: 'تويوتا', value: 'toyota' },
                    { label: 'مرسيدس', value: 'mercedes' },
                    { label: 'بي إم دبليو', value: 'bmw' },
                    { label: 'لكزس', value: 'lexus' },
                    { label: 'مزاد السيارات', value: 'auction' }
                ])
        );

        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
