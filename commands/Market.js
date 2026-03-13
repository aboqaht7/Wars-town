const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'market',
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('سوق الأدوات والمزاد'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('السوق المركزي / Tools Market')
            .setDescription('سنارة، فأس، أدوات، مزاد سيارات وعقارات')
            .setColor('Red')
            .setImage(await db.getImage('market') || null);
        message.channel.send({ embeds: [embed] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('السوق المركزي / Tools Market')
            .setDescription('سنارة، فأس، أدوات، مزاد سيارات وعقارات')
            .setColor('Red')
            .setImage(await db.getImage('market') || null);
        interaction.reply({ embeds: [embed] });
    }
};
