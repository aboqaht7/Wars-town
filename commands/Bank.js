const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'bank',
    data: new SlashCommandBuilder()
        .setName('bank')
        .setDescription('عرض البنك والتحويلات'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('البنك')
            .setDescription('رصيدك وتحويلاتك')
            .setColor('Red')
            .setImage(await db.get('bank_image') || '');
        message.channel.send({ embeds: [embed] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('البنك')
            .setDescription('رصيدك وتحويلاتك')
            .setColor('Red')
            .setImage(await db.get('bank_image') || '');
        interaction.reply({ embeds: [embed] });
    }
};
