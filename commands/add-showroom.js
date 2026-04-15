const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isAdmin } = require('../utils');

module.exports = {
    name: 'اضافة-معرض',
    data: new SlashCommandBuilder()
        .setName('اضافة-معرض')
        .setDescription('Add a car to the showroom')
        .addStringOption(opt => opt.setName('اسم').setDescription('Car name').setRequired(true))
        .addIntegerOption(opt => opt.setName('سعر').setDescription('Car price in SAR').setRequired(true))
        .addStringOption(opt => opt.setName('نوع').setDescription('Car type (sedan, SUV, sports...)').setRequired(false))
        .addStringOption(opt => opt.setName('لون').setDescription('Car color').setRequired(false)),

    async slashExecute(interaction, db) {
        if (!(await isAdmin(interaction.member, db)))
            return interaction.reply({ content: '❌ هذا الأمر للإدارة فقط.', flags: 64 });

        const carName = interaction.options.getString('اسم');
        const price   = interaction.options.getInteger('سعر');
        const carType = interaction.options.getString('نوع') || null;
        const color   = interaction.options.getString('لون') || null;

        await db.addShowroomCar(carName, carType, price, color, interaction.user.id);

        const _img = await db.getImage('showroom').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Car Added to Showroom')
            .setColor(0x2E7D32)
            .addFields(
                { name: '🚗 Car name', value: `\`${carName}\``, inline: true },
                { name: '💰 السعر',       value: `\`${price.toLocaleString()} ريال\``, inline: true },
                { name: '🏷️ النوع',       value: carType ? `\`${carType}\`` : '`غير محدد`', inline: true },
                { name: '🎨 اللون',        value: color   ? `\`${color}\``   : '`غير محدد`', inline: true },
                { name: '👤 أضافها',       value: `${interaction.user}`, inline: true },
            )
            .setFooter({ text: 'Showroom System • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);

        await interaction.reply({ embeds: [embed] });
    }
};
