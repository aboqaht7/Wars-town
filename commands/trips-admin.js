const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'إعداد-رحلات',
    data: new SlashCommandBuilder()
        .setName('إعداد-رحلات')
        .setDescription('تحديد رومات نظام الرحلات (أدمن فقط)')
        .addChannelOption(o => o.setName('روم-التنبيهات').setDescription('الروم الذي تُرسل فيه تنبيهات الإعصار والتجديد والتنبيهات المخصصة').setRequired(true))
        .addChannelOption(o => o.setName('روم-الرحلات').setDescription('الروم الذي يُرسل فيه إشعار بدء الرحلة').setRequired(true)),

    async slashExecute(interaction, db) {
        const alertsChannel = interaction.options.getChannel('روم-التنبيهات');
        const startChannel  = interaction.options.getChannel('روم-الرحلات');

        await db.setConfig('trips_alerts_channel', alertsChannel.id);
        await db.setConfig('trips_start_channel',  startChannel.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ تم إعداد نظام الرحلات')
            .setColor(0xB71C1C)
            .addFields(
                { name: '📣 روم التنبيهات', value: `<#${alertsChannel.id}>`, inline: true },
                { name: '✈️ روم الرحلات',   value: `<#${startChannel.id}>`,  inline: true },
            )
            .setFooter({ text: 'نظام الرحلات • بوت FANTASY' })
            .setTimestamp();
        return interaction.reply({ embeds: [embed] , flags: 64 });
    }
};
