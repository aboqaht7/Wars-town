const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'تعيين-رتبة-مسؤولين-التجارة',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-مسؤولين-التجارة')
        .setDescription('تحديد Rank وقناة وزارة التجارة (أدمن فقط)')
        .addRoleOption(o =>
            o.setName('الرتبة')
             .setDescription('الRank المخصصة لمسؤولي وزارة التجارة')
             .setRequired(true)
        )
        .addChannelOption(o =>
            o.setName('القناة')
             .setDescription('قناة وزارة التجارة لاستقبال طلبات التأسيس')
             .setRequired(true)
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ You do not have permission.', flags: 64 });

        const role = interaction.options.getRole('الرتبة');
        const channel = interaction.options.getChannel('القناة');
        await db.setConfig('trade_ministry_role', role.id);
        await db.setConfig('trade_ministry_channel', channel.id);

        const _img = await db.getImage('market').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Ministry of Commerce Configured')
            .setColor(0x1565C0)
            .addFields(
                { name: '👔 Admins Role',    value: `<@&${role.id}>`,  inline: true },
                { name: '📋 Requests Channel', value: `<#${channel.id}>`, inline: true },
            )
            .setDescription('Members with this role can grant and revoke permits via `/وزارة-التجارة`.\n\nCompany founding requests will be sent to the specified channel with accept/reject buttons.')
            .setFooter({ text: 'Company System • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);
        if (_img) embed.setImage(_img);
        return interaction.reply({ embeds: [embed] });
    },
};
