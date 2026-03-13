const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'events',
    data: new SlashCommandBuilder()
        .setName('events')
        .setDescription('عرض الرحلات'),
    execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('الرحلات')
            .setDescription('فتح الرحلات، اعصار، التنبيهات')
            .setColor('Red')
            .setImage(db.get('events_image') || '');
        message.channel.send({ embeds: [embed] });
    },
    slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('الرحلات')
            .setDescription('فتح رحلة، اعصار، التنبيهات')
            .setColor('Red')
            .setImage(db.get('events_image') || '');
        interaction.reply({ embeds: [embed] });
    }
};
