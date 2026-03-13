const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'admin',
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('نظام الإدارة ونقاط الإدارة'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('الإدارة')
            .setDescription('عرض الرتب ونقاط الإدارة')
            .setColor('Red')
            .setImage(await db.get('admin_image') || '');
        message.channel.send({ embeds: [embed] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('الإدارة')
            .setDescription('عرض الرتب ونقاط الإدارة')
            .setColor('Red')
            .setImage(await db.get('admin_image') || '');
        interaction.reply({ embeds: [embed] });
    }
};
