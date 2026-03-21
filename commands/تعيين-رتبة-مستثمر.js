const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'تعيين-رتبة-مستثمر',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-مستثمر')
        .setDescription('تحديد رتبة المستثمر لإدارة الشركات (أدمن فقط)')
        .addRoleOption(o =>
            o.setName('الرتبة')
             .setDescription('الرتبة المخصصة للمستثمرين')
             .setRequired(true)
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ ليس لديك صلاحية.', flags: 64 });

        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('investor_role', role.id);

        const embed = new EmbedBuilder()
            .setTitle('💼 تم تحديد رتبة المستثمر')
            .setColor(0x1565C0)
            .setDescription(`رتبة **${role.name}** هي الآن رتبة المستثمر.\n\nأصحاب هذه الرتبة يستطيعون استخدام أمر \`/إدارة-شركة\` لإدارة شركاتهم.`)
            .setFooter({ text: 'نظام الشركات • بوت FANTASY' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
