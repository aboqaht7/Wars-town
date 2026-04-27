const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'إعداد-نقاط-الادارة',
    data: new SlashCommandBuilder()
        .setName('إعداد-نقاط-الادارة')
        .setDescription('Configure the admin points system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('مسؤولين')
                .setDescription('Set the role for points admins (the only ones who can add/deduct points)')
                .addRoleOption(o =>
                    o.setName('الرتبة').setDescription('Points admin role').setRequired(true)
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
                    { name: '🛡️ Role',      value: `<@&${role.id}>`, inline: true },
                    { name: 'ℹ️ Permission', value: 'Only members with this role can add or deduct points', inline: false },
                )
                .setFooter({ text: 'Admin Points System • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }
    }
};
