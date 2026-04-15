const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'إعداد-نقاط-الادارة',
    data: new SlashCommandBuilder()
        .setName('إعداد-نقاط-الادارة')
        .setDescription('إعداد نظام نقاط Admin')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('مسؤولين')
                .setDescription('تعيين Rank مسؤولي النقاط (الوحيدون القادرون على إضافة/خصم النقاط)')
                .addRoleOption(o =>
                    o.setName('الرتبة').setDescription('Rank مسؤولي النقاط').setRequired(true)
                )
        ),

    async slashExecute(interaction, db) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'مسؤولين') {
            const role = interaction.options.getRole('الرتبة');
            await db.setConfig('points_admin_role', role.id);
            const _img = await db.getImage('نقاط-الادارة').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Points Admins Role Set')
                .setColor(0x1565C0)
                .addFields(
                    { name: '🛡️ الRank',    value: `<@&${role.id}>`, inline: true },
                    { name: 'ℹ️ الصلاحية', value: 'فقط أصحاب هذه الRank يقدرون يضيفون أو يخصمون النقاط', inline: false },
                )
                .setFooter({ text: 'Admin Points System • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }
    }
};
