const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'properties',
    data: new SlashCommandBuilder()
        .setName('properties')
        .setDescription('عرض العقارات المتاحة'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('معرض العقارات')
            .setDescription('جميع العقارات المتاحة للبيع أو الإيجار')
            .setColor('Red')
            .setImage(await db.getImage('properties') || null);

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('properties_menu')
                .setPlaceholder('اختر العقار')
                .addOptions([
                    { label: 'فيلا', value: 'villa' },
                    { label: 'شقة', value: 'apartment' },
                    { label: 'أرض', value: 'land' },
                    { label: 'مكتب تجاري', value: 'office' }
                ])
        );

        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('معرض العقارات')
            .setDescription('جميع العقارات المتاحة للبيع أو الإيجار')
            .setColor('Red')
            .setImage(await db.getImage('properties') || null);

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('properties_menu')
                .setPlaceholder('اختر العقار')
                .addOptions([
                    { label: 'فيلا', value: 'villa' },
                    { label: 'شقة', value: 'apartment' },
                    { label: 'أرض', value: 'land' },
                    { label: 'مكتب تجاري', value: 'office' }
                ])
        );

        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
