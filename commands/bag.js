const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'bag',
    data: new SlashCommandBuilder()
        .setName('bag')
        .setDescription('عرض الحقيبة والأغراض'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const items = await db.getInventory(message.author.id);
        const embed = new EmbedBuilder()
            .setTitle('الحقيبة')
            .setDescription(items.length ? items.map(i => `• ${i.item_name} (${i.quantity})`).join('\n') : 'حقيبتك فارغة')
            .setColor('Red')
            .setImage(await db.getImage('bag') || '');
        message.channel.send({ embeds: [embed] });
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const items = await db.getInventory(interaction.user.id);
        const embed = new EmbedBuilder()
            .setTitle('الحقيبة')
            .setDescription(items.length ? items.map(i => `• ${i.item_name} (${i.quantity})`).join('\n') : 'حقيبتك فارغة')
            .setColor('Red')
            .setImage(await db.getImage('bag') || '');
        interaction.reply({ embeds: [embed] });
    }
};
