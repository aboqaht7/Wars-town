const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'law',
    data: new SlashCommandBuilder()
        .setName('law')
        .setDescription('نظام المحاماة والقضايا'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('نظام المحاماة')
            .setDescription('إدارة القضايا والمحاماة')
            .setColor('Red')
            .setImage(await db.getImage('law') || '');
        message.channel.send({ embeds: [embed] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('نظام المحاماة')
            .setDescription('إدارة القضايا والمحاماة')
            .setColor('Red')
            .setImage(await db.getImage('law') || '');
        interaction.reply({ embeds: [embed] });
    }
};
