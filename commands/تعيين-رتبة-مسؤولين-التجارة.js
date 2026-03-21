const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'تعيين-رتبة-مسؤولين-التجارة',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-مسؤولين-التجارة')
        .setDescription('تحديد رتبة وقناة وزارة التجارة (أدمن فقط)')
        .addRoleOption(o =>
            o.setName('الرتبة')
             .setDescription('الرتبة المخصصة لمسؤولي وزارة التجارة')
             .setRequired(true)
        )
        .addChannelOption(o =>
            o.setName('القناة')
             .setDescription('قناة وزارة التجارة لاستقبال طلبات التأسيس')
             .setRequired(true)
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ ليس لديك صلاحية.', flags: 64 });

        const role = interaction.options.getRole('الرتبة');
        const channel = interaction.options.getChannel('القناة');
        await db.setConfig('trade_ministry_role', role.id);
        await db.setConfig('trade_ministry_channel', channel.id);

        const embed = new EmbedBuilder()
            .setTitle('🏛️ تم إعداد وزارة التجارة')
            .setColor(0x1565C0)
            .addFields(
                { name: '👔 رتبة المسؤولين', value: `<@&${role.id}>`, inline: true },
                { name: '📋 قناة الطلبات', value: `<#${channel.id}>`, inline: true },
            )
            .setDescription('أصحاب هذه الرتبة يستطيعون منح وسحب التصاريح عبر `/وزارة-التجارة`.\n\nطلبات تأسيس الشركات ستُرسل للقناة المحددة مع أزرار قبول/رفض.')
            .setFooter({ text: 'نظام الشركات • بوت FANTASY' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
