const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'تعيين-رتبة-مسؤولين-التجارة',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-مسؤولين-التجارة')
        .setDescription('تحديد رتبة مسؤولي وزارة التجارة (أدمن فقط)')
        .addRoleOption(o =>
            o.setName('الرتبة')
             .setDescription('الرتبة المخصصة لمسؤولي وزارة التجارة')
             .setRequired(true)
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ ليس لديك صلاحية.', flags: 64 });

        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('trade_ministry_role', role.id);

        const embed = new EmbedBuilder()
            .setTitle('🏛️ تم إعداد وزارة التجارة')
            .setColor(0x1565C0)
            .setDescription(`رتبة **${role.name}** هي الآن رتبة مسؤولي وزارة التجارة.\n\nأصحاب هذه الرتبة يستطيعون منح وسحب التصاريح التجارية عبر الأمر \`/وزارة-التجارة\`.`)
            .setFooter({ text: 'نظام الشركات • بوت FANTASY' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
