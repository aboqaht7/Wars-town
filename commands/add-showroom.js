const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isAdmin } = require('../utils');

module.exports = {
    name: 'اضافة-معرض',
    data: new SlashCommandBuilder()
        .setName('اضافة-معرض')
        .setDescription('إضافة سيارة إلى معرض السيارات')
        .addStringOption(opt => opt.setName('اسم').setDescription('اسم السيارة').setRequired(true))
        .addIntegerOption(opt => opt.setName('سعر').setDescription('سعر السيارة بالريال').setRequired(true))
        .addStringOption(opt => opt.setName('نوع').setDescription('نوع السيارة (سيدان، SUV، رياضية...)').setRequired(false))
        .addStringOption(opt => opt.setName('لون').setDescription('لون السيارة').setRequired(false)),

    async slashExecute(interaction, db) {
        if (!(await isAdmin(interaction.member, db)))
            return interaction.reply({ content: '❌ هذا الأمر للإدارة فقط.', flags: 64 });

        const carName = interaction.options.getString('اسم');
        const price   = interaction.options.getInteger('سعر');
        const carType = interaction.options.getString('نوع') || null;
        const color   = interaction.options.getString('لون') || null;

        await db.addShowroomCar(carName, carType, price, color, interaction.user.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ تم إضافة السيارة للمعرض')
            .setColor(0x2E7D32)
            .addFields(
                { name: '🚗 اسم السيارة', value: `\`${carName}\``, inline: true },
                { name: '💰 السعر',       value: `\`${price.toLocaleString()} ريال\``, inline: true },
                { name: '🏷️ النوع',       value: carType ? `\`${carType}\`` : '`غير محدد`', inline: true },
                { name: '🎨 اللون',        value: color   ? `\`${color}\``   : '`غير محدد`', inline: true },
                { name: '👤 أضافها',       value: `${interaction.user}`, inline: true },
            )
            .setFooter({ text: 'نظام المعارض • بوت FANTASY' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
