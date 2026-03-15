const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'حذف-معرض',
    data: new SlashCommandBuilder()
        .setName('حذف-معرض')
        .setDescription('حذف سيارة من معرض السيارات')
        .addIntegerOption(opt => opt.setName('رقم').setDescription('رقم السيارة (ID من أمر /معارض)').setRequired(true)),
    async execute(message, args, db) {
        const id = parseInt(args[0]);
        if (!id) return message.reply('❌ استخدم: `-حذف-معرض [رقم السيارة]`\nاستخدم `/معارض` لمعرفة أرقام السيارات.');
        const removed = await db.removeShowroomCar(id);
        if (!removed) return message.reply(`❌ لم يتم العثور على سيارة برقم \`${id}\``);
        const embed = new EmbedBuilder()
            .setTitle('🗑️ تم حذف السيارة من المعرض')
            .setColor(0xB71C1C)
            .addFields(
                { name: '🔢 رقم السيارة', value: `\`${id}\``, inline: true },
                { name: '👤 نفذها', value: `${message.author}`, inline: true },
            )
            .setFooter({ text: 'نظام المعارض • بوت FANTASY' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    },
    async slashExecute(interaction, db) {
        const id = interaction.options.getInteger('رقم');
        const removed = await db.removeShowroomCar(id);
        if (!removed) return interaction.reply({ content: `❌ لم يتم العثور على سيارة برقم \`${id}\``, flags: 64 });
        const embed = new EmbedBuilder()
            .setTitle('🗑️ تم حذف السيارة من المعرض')
            .setColor(0xB71C1C)
            .addFields(
                { name: '🔢 رقم السيارة', value: `\`${id}\``, inline: true },
                { name: '👤 نفذها', value: `${interaction.user}`, inline: true },
            )
            .setFooter({ text: 'نظام المعارض • بوت FANTASY' })
            .setTimestamp();
        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: '​', flags: 64 });
    }
};
