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

        const _img = await db.getImage('identity').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Activation Channel Set')
            .setColor(0x1565C0)
            .addFields(
                { name: '📢 القناة', value: `<#${channel.id}>`, inline: true },
            )
            .setFooter({ text: 'Activation System • FANTASY Bot' }).setTimestamp();

        if (_img) embed.setImage(_img);
        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '​', flags: 64 });
    },
};
