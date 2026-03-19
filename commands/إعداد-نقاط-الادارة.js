const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'إعداد-نقاط-الادارة',
    data: new SlashCommandBuilder()
        .setName('إعداد-نقاط-الادارة')
        .setDescription('إعداد نظام نقاط الإدارة')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('مسؤولين')
                .setDescription('تعيين رتبة مسؤولي النقاط (الوحيدون القادرون على إضافة/خصم النقاط)')
                .addRoleOption(o =>
                    o.setName('الرتبة').setDescription('رتبة مسؤولي النقاط').setRequired(true)
                )
        ),

    async slashExecute(interaction, db) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'مسؤولين') {
            const role = interaction.options.getRole('الرتبة');
            await db.setConfig('points_admin_role', role.id);
            const embed = new EmbedBuilder()
                .setTitle('✅ تم تعيين رتبة مسؤولي النقاط')
                .setColor(0x1565C0)
                .addFields(
                    { name: '🛡️ الرتبة',    value: `<@&${role.id}>`, inline: true },
                    { name: 'ℹ️ الصلاحية', value: 'فقط أصحاب هذه الرتبة يقدرون يضيفون أو يخصمون النقاط', inline: false },
                )
                .setFooter({ text: 'نظام نقاط الإدارة • بوت FANTASY' }).setTimestamp();
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }
    }
};
