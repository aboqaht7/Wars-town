const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'events',
    data: new SlashCommandBuilder()
        .setName('events')
        .setDescription('عرض الرحلات والأحداث'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('✈️ الرحلات والأحداث')
            .setColor(0x6A1B9A)
            .setDescription('اختر نوع الحدث الذي تريد تفعيله')
            .addFields(
                { name: '📍 الموقع', value: 'تواصل مع الإدارة لمعرفة موقع الحدث', inline: true },
                { name: '⏰ التوقيت', value: 'يحدده المشرف المسؤول', inline: true },
            )
            .setImage(await db.getImage('events') || null)
            .setFooter({ text: 'نظام الأحداث • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('events_menu')
                .setPlaceholder('اختر نوع الحدث')
                .addOptions([
                    { label: '✈️ فتح رحلة', value: 'open_flight' },
                    { label: '🌀 إعصار', value: 'hurricane' },
                    { label: '📣 تنبيه عام', value: 'alert' },
                    { label: '🎉 حدث خاص', value: 'special_event' },
                ])
        );
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('✈️ الرحلات والأحداث')
            .setColor(0x6A1B9A)
            .setDescription('اختر نوع الحدث الذي تريد تفعيله')
            .addFields(
                { name: '📍 الموقع', value: 'تواصل مع الإدارة لمعرفة موقع الحدث', inline: true },
                { name: '⏰ التوقيت', value: 'يحدده المشرف المسؤول', inline: true },
            )
            .setImage(await db.getImage('events') || null)
            .setFooter({ text: 'نظام الأحداث • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('events_menu')
                .setPlaceholder('اختر نوع الحدث')
                .addOptions([
                    { label: '✈️ فتح رحلة', value: 'open_flight' },
                    { label: '🌀 إعصار', value: 'hurricane' },
                    { label: '📣 تنبيه عام', value: 'alert' },
                    { label: '🎉 حدث خاص', value: 'special_event' },
                ])
        );
        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
