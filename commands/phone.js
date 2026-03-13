const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'phone',
    data: new SlashCommandBuilder()
        .setName('phone')
        .setDescription('عرض الجوال'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('الجوال')
            .setDescription('اختر خيار من الجوال')
            .setColor('Red')
            .setImage(await db.getImage('phone') || null);
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('phone_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: 'اتصال', value: 'call' },
                    { label: 'رسائل', value: 'messages' },
                    { label: 'جهات الاتصال', value: 'contacts' },
                    { label: 'الإعدادات', value: 'settings' },
                ])
        );
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('الجوال')
            .setDescription('اختر خيار من الجوال')
            .setColor('Red')
            .setImage(await db.getImage('phone') || null);
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('phone_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: 'اتصال', value: 'call' },
                    { label: 'رسائل', value: 'messages' },
                    { label: 'جهات الاتصال', value: 'contacts' },
                    { label: 'الإعدادات', value: 'settings' },
                ])
        );
        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
