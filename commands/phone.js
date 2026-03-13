const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'phone',
    data: new SlashCommandBuilder()
        .setName('phone')
        .setDescription('عرض الجوال'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('الجوال')
            .setDescription('هاتفك المحمول')
            .setColor('Red')
            .setImage(await db.get('phone_image') || '');
        message.channel.send({ embeds: [embed] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('الجوال')
            .setDescription('هاتفك المحمول')
            .setColor('Red')
            .setImage(await db.get('phone_image') || '');
        interaction.reply({ embeds: [embed] });
    }
};
