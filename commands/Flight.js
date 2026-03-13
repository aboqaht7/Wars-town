const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'events',
    data: new SlashCommandBuilder()
        .setName('events')
        .setDescription('عرض الرحلات'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('الرحلات')
            .setDescription('فتح الرحلات، اعصار، التنبيهات')
            .setColor('Red')
            .setImage(await db.getImage('events') || null);
        message.channel.send({ embeds: [embed] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('الرحلات')
            .setDescription('فتح رحلة، اعصار، التنبيهات')
            .setColor('Red')
            .setImage(await db.getImage('events') || null);
        interaction.reply({ embeds: [embed] });
    }
};
