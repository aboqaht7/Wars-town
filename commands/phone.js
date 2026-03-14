const { SlashCommandBuilder } = require('discord.js');
const { buildSnap } = require('./snap');

module.exports = {
    name: 'phone',
    data: new SlashCommandBuilder()
        .setName('phone')
        .setDescription('عرض الجوال'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const account = await db.getSnapAccount(message.author.id);
        const img = await db.getImage('snap');
        message.channel.send(buildSnap(account, img));
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const account = await db.getSnapAccount(interaction.user.id);
        const img = await db.getImage('snap');
        interaction.reply(buildSnap(account, img));
    }
};
