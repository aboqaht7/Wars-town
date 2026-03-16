const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'تعيين-رتبة-مبند',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-مبند')
        .setDescription('🔧 تحديد رتبة المبند التي تُعطى عند إصدار مخالفة')
        .addRoleOption(o =>
            o.setName('الرتبة').setDescription('الرتبة التي تمثل المبند').setRequired(true)
        ),

    async slashExecute(interaction, db) {
        const { isAdmin } = require('../utils');
        if (!(await isAdmin(interaction.member, db)))
            return interaction.reply({ content: '❌ للإدارة فقط.', flags: 64 });

        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('violation_role_id', role.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ تم تعيين رتبة المبند')
            .setColor(0xB71C1C)
            .setDescription('ستُعطى هذه الرتبة تلقائياً عند إصدار أمر `-مخالف`، وتُرفع عند انتهاء المدة أو تنفيذ `-فك-مخالف`.')
            .addFields(
                { name: '🚫 الرتبة',       value: `<@&${role.id}>`, inline: true },
                { name: '🆔 معرّف الرتبة', value: role.id,          inline: true },
            )
            .setFooter({ text: 'نظام المخالفات • بوت FANTASY' })
            .setTimestamp();

        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '​', flags: 64 });
    },
};
