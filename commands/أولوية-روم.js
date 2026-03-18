const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'أولوية-روم',
    data: new SlashCommandBuilder()
        .setName('أولوية-روم')
        .setDescription('تعيين الروم الذي تُرسل إليه إشعارات الأولوية')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(opt =>
            opt.setName('الروم')
                .setDescription('روم إرسال الأولوية')
                .setRequired(true)
        ),

    async slashExecute(interaction, db) {
        const channel = interaction.options.getChannel('الروم');
        await db.setConfig('priority_channel_id', channel.id);
        await interaction.reply({
            content: `✅ تم تعيين روم الأولوية: <#${channel.id}>`,
            flags: 64
        });
    }
};
