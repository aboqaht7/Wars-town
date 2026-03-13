const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'police',
    data: new SlashCommandBuilder()
        .setName('police')
        .setDescription('نظام الشرطة'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('الشرطة')
            .setDescription('أوامر: كلبشة، تلويت، باند، تشهير')
            .setColor('Red')
            .setImage(await db.getImage('police') || '');
        message.channel.send({ embeds: [embed] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('الشرطة')
            .setDescription('أوامر: كلبشة، تلويت، باند، تشهير')
            .setColor('Red')
            .setImage(await db.getImage('police') || '');
        interaction.reply({ embeds: [embed] });
    }
};
