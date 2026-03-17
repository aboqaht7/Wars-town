const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'تعيين-مسؤولين-رتبة-الباند',
    data: new SlashCommandBuilder()
        .setName('تعيين-مسؤولين-رتبة-الباند')
        .setDescription('تعيين الرتبة التي يحق لها تنفيذ أوامر التشهير والطرد النهائي')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(opt =>
            opt.setName('الرتبة')
                .setDescription('الرتبة المخوّلة بتنفيذ أوامر الباند')
                .setRequired(true)
        ),

    async slashExecute(interaction, db) {
        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('ban_role_id', role.id);
        await interaction.reply({ content: `✅ تم تعيين **${role.name}** كرتبة مسؤولي الباند.`, flags: 64 });
    }
};
