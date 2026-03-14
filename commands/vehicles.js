const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'سيارات',
    data: new SlashCommandBuilder()
        .setName('سيارات')
        .setDescription('عرض سياراتك المسجلة'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const cars = await db.getVehicles(message.author.id);
        const embed = new EmbedBuilder()
            .setTitle('🚗 سياراتي المسجلة')
            .setColor(0x37474F)
            .setDescription(cars.length
                ? cars.map(c => `🚗 **${c.car_name}** — لوحة: \`${c.plate}\``).join('\n')
                : '> لا توجد سيارات مسجلة بعد')
            .addFields({ name: '🔢 عدد السيارات', value: `\`${cars.length}\``, inline: true })
            .setImage(await db.getImage('vehicles') || null)
            .setFooter({ text: 'نظام السيارات • بوت FANTASY' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const cars = await db.getVehicles(interaction.user.id);
        const embed = new EmbedBuilder()
            .setTitle('🚗 سياراتي المسجلة')
            .setColor(0x37474F)
            .setDescription(cars.length
                ? cars.map(c => `🚗 **${c.car_name}** — لوحة: \`${c.plate}\``).join('\n')
                : '> لا توجد سيارات مسجلة بعد')
            .addFields({ name: '🔢 عدد السيارات', value: `\`${cars.length}\``, inline: true })
            .setImage(await db.getImage('vehicles') || null)
            .setFooter({ text: 'نظام السيارات • بوت FANTASY' })
            .setTimestamp();
        interaction.reply({ embeds: [embed] });
    }
};
