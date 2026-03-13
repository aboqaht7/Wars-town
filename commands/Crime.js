const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'crime',
    data: new SlashCommandBuilder()
        .setName('crime')
        .setDescription('نظام الجرائم: سرقات وخطف'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('الجرائم')
            .setDescription('عرض الجرائم، سرقات وخطف')
            .setColor('Red')
            .setImage(await db.getImage('crime') || '');
        message.channel.send({ embeds: [embed] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('الجرائم')
            .setDescription('عرض الجرائم، سرقات وخطف')
            .setColor('Red')
            .setImage(await db.getImage('crime') || '');
        interaction.reply({ embeds: [embed] });
    }
};
