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

        const _img = await db.getImage('identity').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Identity Log Channel Set')
            .setColor(0x7B1FA2)
            .addFields(
                { name: '📋 الروم المحدد', value: `<#${channel.id}>`, inline: true },
                { name: 'ℹ️ ما يُسجل تلقائياً', value: '🪪 كل طلبات إنشاء الهويات تصل هنا مع أزرار القبول والرفض', inline: false },
            )
            .setFooter({ text: 'Identity System • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);
        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '​', flags: 64 });
    }
};
