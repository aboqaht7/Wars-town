const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'بلاغ-سرقة-روم',
    data: new SlashCommandBuilder()
        .setName('بلاغ-سرقة-روم')
        .setDescription('تحديد روم الشرطة لاستقبال بلاغات السرقة')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(opt =>
            opt.setName('الروم')
                .setDescription('روم الشرطة')
                .setRequired(true)
        ),

    async slashExecute(interaction, db) {
        const channel = interaction.options.getChannel('الروم');
        await db.setConfig('robbery_report_channel', channel.id);
        await interaction.reply({
            content: `✅ تم تعيين روم بلاغات السرقة: <#${channel.id}>`,
            flags: 64
        });
    }
};
