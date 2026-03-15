const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'اضافة-سيارة',
    data: new SlashCommandBuilder()
        .setName('اضافة-سيارة')
        .setDescription('إضافة سيارة جديدة للاعب')
        .addUserOption(opt => opt.setName('لاعب').setDescription('اللاعب المراد إضافة السيارة له').setRequired(true))
        .addStringOption(opt => opt.setName('اسم-السيارة').setDescription('اسم السيارة ونوعها').setRequired(true))
        .addStringOption(opt => opt.setName('لوحة').setDescription('رقم لوحة السيارة').setRequired(true)),
    async execute(message, args, db) {
        const target = message.mentions.members?.first();
        const carName = args.filter(a => !a.startsWith('<@')).slice(0, -1).join(' ') || args.filter(a => !a.startsWith('<@'))[0];
        const plate = args[args.length - 1];
        if (!target || !carName || !plate) {
            return message.reply('❌ استخدم: `-اضافة-سيارة @اللاعب [اسم السيارة] [رقم اللوحة]`\nمثال: `-اضافة-سيارة @اللاعب كامري ABC123`');
        }
        await db.ensureUser(target.id, target.user.username);
        const result = await db.addVehicle(target.id, carName, plate);
        if (!result.success) {
            return message.reply(`❌ ${result.error}`);
        }
        const embed = new EmbedBuilder()
            .setTitle('🚗 تم تسجيل السيارة')
            .setColor(0x37474F)
            .addFields(
                { name: '👤 المالك', value: `${target}`, inline: true },
                { name: '🚗 اسم السيارة', value: `\`${carName}\``, inline: true },
                { name: '🔖 رقم اللوحة', value: `\`${plate}\``, inline: true },
                { name: '👮 أضافها', value: `${message.author}`, inline: true },
            )
            .setFooter({ text: 'نظام السيارات • بوت FANTASY' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    },
    async slashExecute(interaction, db) {
        const target = interaction.options.getUser('لاعب');
        const carName = interaction.options.getString('اسم-السيارة');
        const plate = interaction.options.getString('لوحة');
        await db.ensureUser(target.id, target.username);
        const result = await db.addVehicle(target.id, carName, plate);
        if (!result.success) {
            return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });
        }
        const embed = new EmbedBuilder()
            .setTitle('🚗 تم تسجيل السيارة')
            .setColor(0x37474F)
            .addFields(
                { name: '👤 المالك', value: `<@${target.id}>`, inline: true },
                { name: '🚗 اسم السيارة', value: `\`${carName}\``, inline: true },
                { name: '🔖 رقم اللوحة', value: `\`${plate}\``, inline: true },
                { name: '👮 أضافها', value: `${interaction.user}`, inline: true },
            )
            .setFooter({ text: 'نظام السيارات • بوت FANTASY' })
            .setTimestamp();
        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: '​', flags: 64 });
    }
};
