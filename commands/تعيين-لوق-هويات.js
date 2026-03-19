const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'تعيين-لوق-هويات',
    data: new SlashCommandBuilder()
        .setName('تعيين-لوق-هويات')
        .setDescription('تعيين روم تسجيل طلبات إنشاء الهويات')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(opt =>
            opt.setName('الروم')
                .setDescription('روم لوق الهويات')
                .setRequired(true)
        ),

    async slashExecute(interaction, db) {
        const channel = interaction.options.getChannel('الروم');
        await db.setConfig('identity_log_channel', channel.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ تم تعيين روم لوق الهويات')
            .setColor(0x7B1FA2)
            .addFields(
                { name: '📋 الروم المحدد', value: `<#${channel.id}>`, inline: true },
                { name: 'ℹ️ ما يُسجل تلقائياً', value: '🪪 كل طلبات إنشاء الهويات تصل هنا مع أزرار القبول والرفض', inline: false },
            )
            .setFooter({ text: 'نظام الهوية • بوت FANTASY' })
            .setTimestamp();

        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '​', flags: 64 });
    }
};
