const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'اضافة-معرض',
    data: new SlashCommandBuilder()
        .setName('اضافة-معرض')
        .setDescription('إضافة سيارة إلى معرض السيارات')
        .addStringOption(opt => opt.setName('اسم').setDescription('اسم السيارة').setRequired(true))
        .addIntegerOption(opt => opt.setName('سعر').setDescription('سعر السيارة بالريال').setRequired(true))
        .addStringOption(opt => opt.setName('نوع').setDescription('نوع السيارة (سيدان، SUV، رياضية...)').setRequired(false))
        .addStringOption(opt => opt.setName('لون').setDescription('لون السيارة').setRequired(false)),
    async execute(message, args, db) {
        const carName = args[0];
        const price = parseInt(args[1]);
        const carType = args[2] || null;
        const color = args[3] || null;

        if (!carName || isNaN(price)) {
            return message.reply('❌ استخدم: `-اضافة-معرض [اسم] [سعر] [نوع] [لون]`\nمثال: `-اضافة-معرض كامري 80000 سيدان أبيض`');
        }

        await db.addShowroomCar(carName, carType, price, color, message.author.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ تم إضافة السيارة للمعرض')
            .setColor(0x2E7D32)
            .addFields(
                { name: '🚗 اسم السيارة', value: `\`${carName}\``, inline: true },
                { name: '💰 السعر', value: `\`${price.toLocaleString()} ريال\``, inline: true },
                { name: '🏷️ النوع', value: carType ? `\`${carType}\`` : '`غير محدد`', inline: true },
                { name: '🎨 اللون', value: color ? `\`${color}\`` : '`غير محدد`', inline: true },
                { name: '👤 أضافها', value: `${message.author}`, inline: true },
            )
            .setFooter({ text: 'نظام المعارض • بوت FANTASY' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    },
    async slashExecute(interaction, db) {
        const carName = interaction.options.getString('اسم');
        const price = interaction.options.getInteger('سعر');
        const carType = interaction.options.getString('نوع');
        const color = interaction.options.getString('لون');

        await db.addShowroomCar(carName, carType, price, color, interaction.user.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ تم إضافة السيارة للمعرض')
            .setColor(0x2E7D32)
            .addFields(
                { name: '🚗 اسم السيارة', value: `\`${carName}\``, inline: true },
                { name: '💰 السعر', value: `\`${price.toLocaleString()} ريال\``, inline: true },
                { name: '🏷️ النوع', value: carType ? `\`${carType}\`` : '`غير محدد`', inline: true },
                { name: '🎨 اللون', value: color ? `\`${color}\`` : '`غير محدد`', inline: true },
                { name: '👤 أضافها', value: `${interaction.user}`, inline: true },
            )
            .setFooter({ text: 'نظام المعارض • بوت FANTASY' })
            .setTimestamp();
        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: '​', flags: 64 });
    }
};
