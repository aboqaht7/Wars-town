const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'تعيين-قناة-تفعيل',
    data: new SlashCommandBuilder()
        .setName('تعيين-قناة-تفعيل')
        .setDescription('🔧 تحديد قناة سجل طلبات التفعيل')
        .addChannelOption(o =>
            o.setName('القناة').setDescription('القناة التي تصلها طلبات التفعيل').setRequired(true)
        ),

    async slashExecute(interaction, db) {
        const { isAdmin } = require('../utils');
        if (!(await isAdmin(interaction.member, db)))
            return interaction.reply({ content: '❌ للإدارة فقط.', flags: 64 });

        const channel = interaction.options.getChannel('القناة');
        await db.setConfig('activation_log_channel', channel.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ تم تعيين قناة طلبات التفعيل')
            .setColor(0x1565C0)
            .addFields(
                { name: '📢 القناة', value: `<#${channel.id}>`, inline: true },
            )
            .setFooter({ text: 'نظام التفعيل • بوت FANTASY' }).setTimestamp();

        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '​', flags: 64 });
    },
};
