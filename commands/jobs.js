const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'jobs',
    data: new SlashCommandBuilder()
        .setName('jobs')
        .setDescription('عرض الوظائف الحرة'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('الوظائف الحرة')
            .setDescription('صيد السمك، تكسي، صيد الحيوانات، منجم')
            .setColor('Red')
            .setImage(await db.get('jobs_image') || '');
        message.channel.send({ embeds: [embed] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('الوظائف الحرة')
            .setDescription('صيد السمك، تكسي، صيد الحيوانات، منجم')
            .setColor('Red')
            .setImage(await db.get('jobs_image') || '');
        interaction.reply({ embeds: [embed] });
    }
};
