const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'events',
    data: new SlashCommandBuilder()
        .setName('events')
        .setDescription('عرض الرحلات والأحداث'),
    async execute(message, args, db) {
        const { embed, menu } = await build(db);
        message.channel.send({ embeds: [embed], components: [menu, resetRow('events')] });
    },
    async slashExecute(interaction, db) {
        const { embed, menu } = await build(db);
        const main = { embeds: [embed], components: [menu, resetRow('events')] };
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.reply({ content: '​', flags: 64 });
    }
};

async function build(db) {
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
                { label: '🌪️ إعصار', value: 'hurricane' },
                { label: '📣 تنبيه عام', value: 'alert' },
                { label: '🎉 حدث خاص', value: 'special_event' },
            ])
    );
    return { embed, menu };
}
