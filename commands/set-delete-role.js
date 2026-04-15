const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'تعيين-مسؤولين-الحذف',
    data: new SlashCommandBuilder()
        .setName('تعيين-مسؤولين-الحذف')
        .setDescription('تعيين الRank التي يحق لها تنفيذ أمر الحذف (-مسح)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(opt =>
            opt.setName('الرتبة')
                .setDescription('الRank المخوّلة بتنفيذ أمر الحذف')
                .setRequired(true)
        ),

    async slashExecute(interaction, db) {
        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('delete_role_id', role.id);
        await interaction.reply({ content: `✅ تم تعيين **${role.name}** كRank مسؤولي الحذف.`, flags: 64 });
    }
};
