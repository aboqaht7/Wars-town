const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'events',
    data: new SlashCommandBuilder()
        .setName('events')
        .setDescription('عرض الرحلات'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('الرحلات والأحداث')
            .setDescription('اختر نوع الحدث')
            .setColor('Red')
            .setImage(await db.getImage('events') || null);
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('events_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: 'فتح رحلة', value: 'open_flight' },
                    { label: 'إعصار', value: 'hurricane' },
                    { label: 'تنبيه عام', value: 'alert' },
                    { label: 'حدث خاص', value: 'special_event' },
                ])
        );
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('الرحلات والأحداث')
            .setDescription('اختر نوع الحدث')
            .setColor('Red')
            .setImage(await db.getImage('events') || null);
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('events_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: 'فتح رحلة', value: 'open_flight' },
                    { label: 'إعصار', value: 'hurricane' },
                    { label: 'تنبيه عام', value: 'alert' },
                    { label: 'حدث خاص', value: 'special_event' },
                ])
        );
        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
