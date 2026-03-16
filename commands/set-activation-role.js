const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'تعيين-رتبة-تفعيل',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-تفعيل')
        .setDescription('🔧 تحديد الرتبة التي تُعطى عند قبول طلب التفعيل')
        .addRoleOption(o =>
            o.setName('الرتبة').setDescription('رتبة المفعّلين').setRequired(true)
        ),

    async slashExecute(interaction, db) {
        const { isAdmin } = require('../utils');
        if (!(await isAdmin(interaction.member, db)))
            return interaction.reply({ content: '❌ للإدارة فقط.', flags: 64 });

        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('activation_role_id', role.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ تم تعيين رتبة التفعيل')
            .setColor(0x2E7D32)
            .addFields(
                { name: '🎖️ الرتبة',       value: `<@&${role.id}>`, inline: true },
                { name: '🆔 معرّف الرتبة', value: role.id,          inline: true },
            )
            .setFooter({ text: 'نظام التفعيل • بوت FANTASY' }).setTimestamp();

        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '​', flags: 64 });
    },
};
