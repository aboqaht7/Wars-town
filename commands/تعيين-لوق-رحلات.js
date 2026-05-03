const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'تعيين-لوق-رحلات',
    data: new SlashCommandBuilder()
        .setName('تعيين-لوق-رحلات')
        .setDescription('تعيين روم تسجيل أحداث الرحلات (بدء، Hurricane، Renew، Alert)')
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
            .setColor(0xE53935)
            .addFields(
                { name: '📋 Selected Channel', value: `<#${channel.id}>`, inline: true },
                { name: 'ℹ️ Logged automatically', value: '✈️ Start Trip • 🌪️ Hurricane\n🔄 Renew Trip • 📢 Alert', inline: false },
            )
            .setFooter({ text: 'Trip System • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);
        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '​', flags: 64 });
    }
};
