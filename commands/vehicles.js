const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'سيارات',
    data: new SlashCommandBuilder()
        .setName('سيارات')
        .setDescription('عرض سياراتك المسجلة'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const cars = await db.getVehicles(message.author.id);
        const embed = build(cars, message.author.username, await db.getImage('vehicles'));
        message.channel.send({ embeds: [embed], components: [resetRow('vehicles')] });
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const cars = await db.getVehicles(interaction.user.id);
        const embed = build(cars, interaction.user.username, await db.getImage('vehicles'));
        interaction.reply({ embeds: [embed], components: [resetRow('vehicles')] });
    }
};

function build(cars, username, image) {
    return new EmbedBuilder()
        .setTitle('🚗 سياراتي المسجلة')
        .setColor(0x37474F)
        .setDescription(cars.length
            ? cars.map(c => `🚗 **${c.car_name}** — لوحة: \`${c.plate}\``).join('\n')
            : '> لا توجد سيارات مسجلة بعد')
        .addFields({ name: '🔢 عدد السيارات', value: `\`${cars.length}\``, inline: true })
        .setImage(image || null)
        .setFooter({ text: 'نظام السيارات • بوت FANTASY' })
        .setTimestamp();
}
