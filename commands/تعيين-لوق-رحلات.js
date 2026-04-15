const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'تعيين-لوق-رحلات',
    data: new SlashCommandBuilder()
        .setName('تعيين-لوق-رحلات')
        .setDescription('تعيين روم تسجيل أحداث الرحلات (بدء، إعصار، تجديد، تنبيه)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(opt =>
            opt.setName('الروم')
                .setDescription('روم لوق الرحلات')
                .setRequired(true)
        ),

    async slashExecute(interaction, db) {
        const channel = interaction.options.getChannel('الروم');
        await db.setConfig('trip_log_channel', channel.id);

        const _img = await db.getImage('events').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Trip Log Channel Set')
            .setColor(0x1565C0)
            .addFields(
                { name: '📋 الروم المحدد', value: `<#${channel.id}>`, inline: true },
                { name: 'ℹ️ ما يُسجل تلقائياً', value: '✈️ بدء رحلة • 🌪️ إعصار\n🔄 تجديد رحلة • 📢 تنبيه', inline: false },
            )
            .setFooter({ text: 'نظام الرحلات • بوت FANTASY' })
            .setTimestamp();

        if (_img) embed.setImage(_img);
        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '​', flags: 64 });
    }
};
