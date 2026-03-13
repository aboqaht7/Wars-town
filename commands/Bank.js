const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'bank',
    data: new SlashCommandBuilder()
        .setName('bank')
        .setDescription('عرض البنك والتحويلات'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const balance = await db.getBalance(message.author.id);
        const embed = new EmbedBuilder()
            .setTitle('البنك')
            .setDescription(`رصيدك الحالي: **${balance.toLocaleString()}** ريال`)
            .setColor('Red')
            .setImage(await db.getImage('bank') || '');
        message.channel.send({ embeds: [embed] });
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const balance = await db.getBalance(interaction.user.id);
        const embed = new EmbedBuilder()
            .setTitle('البنك')
            .setDescription(`رصيدك الحالي: **${balance.toLocaleString()}** ريال`)
            .setColor('Red')
            .setImage(await db.getImage('bank') || '');
        interaction.reply({ embeds: [embed] });
    }
};
