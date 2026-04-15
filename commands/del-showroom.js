const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isAdmin } = require('../utils');

module.exports = {
    name: 'حذف-معرض',
    data: new SlashCommandBuilder()
        .setName('حذف-معرض')
        .setDescription('حذف سيارة من معرض السيارات')
        .addIntegerOption(opt => opt.setName('رقم').setDescription('رقم السيارة (ID)').setRequired(true)),

    async slashExecute(interaction, db) {
        if (!(await isAdmin(interaction.member, db)))
            return interaction.reply({ content: '❌ هذا الأمر للإدارة فقط.', flags: 64 });

        const id = interaction.options.getInteger('رقم');
        const removed = await db.removeShowroomCar(id);
        if (!removed)
            return interaction.reply({ content: `❌ لم يتم العثور على سيارة برقم \`${id}\``, flags: 64 });

        const _img = await db.getImage('showroom').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('تم حذف السيارة من المعرض')
            .setColor(0xB71C1C)
            .addFields(
                { name: '🔢 رقم السيارة', value: `\`${id}\``, inline: true },
                { name: '👤 نفذها',        value: `${interaction.user}`, inline: true },
            )
            .setFooter({ text: 'نظام المعارض • بوت FANTASY' })
            .setTimestamp();

        if (_img) embed.setImage(_img);

        await interaction.reply({ embeds: [embed] });
    }
};
