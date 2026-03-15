const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary)
);

module.exports = {
    name: 'تعيين-رتبة-محامي',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-محامي')
        .setDescription('🔧 تحديد رتبة الديسكورد الخاصة بالمحامين')
        .addRoleOption(o => o.setName('الرتبة').setDescription('الرتبة التي تمثل المحامين').setRequired(true)),

    async slashExecute(interaction, db) {
        const { isAdmin } = require('../utils');
        if (!(await isAdmin(interaction.member, db)))
            return interaction.reply({ content: '❌ للإدارة فقط.', flags: 64 });

        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('lawyer_role_id', role.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ تم تعيين رتبة المحامين')
            .setColor(0x1565C0)
            .setDescription('أعضاء هذه الرتبة سيظهرون في قائمة المحامين عند توكيل محامٍ.')
            .addFields(
                { name: '👨‍⚖️ الرتبة',      value: `<@&${role.id}>`, inline: true },
                { name: '🆔 معرّف الرتبة',  value: role.id,          inline: true },
            )
            .setFooter({ text: 'نظام المحاماة • بوت FANTASY' })
            .setTimestamp();

        await interaction.channel.send({ embeds: [embed], components: [row2] });
        return interaction.reply({ content: '​', flags: 64 });
    },
};
