const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'هوية-رتبة',
    data: new SlashCommandBuilder()
        .setName('هوية-رتبة')
        .setDescription('تعيين الرتبة التي تُمنح تلقائياً عند قبول الهوية')
        .addRoleOption(opt =>
            opt.setName('رتبة').setDescription('الرتبة التي تُعطى عند قبول الهوية').setRequired(true)),

    async slashExecute(interaction, db) {
        const role = interaction.options.getRole('رتبة');
        await db.setConfig('identity_role', role.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ تم تعيين رتبة الهوية')
            .setColor(0x1565C0)
            .setDescription(`سيحصل كل من تُقبل هويته على رتبة ${role} تلقائياً.`)
            .setFooter({ text: 'نظام الهوية • بوت FANTASY' })
            .setTimestamp();
        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '​', flags: 64 });
    }
};
