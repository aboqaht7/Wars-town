const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'تعيين-رتبة-افراد-cia',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-افراد-cia')
        .setDescription('تحديد رتبة أفراد CIA (أدمن فقط)')
        .addRoleOption(o =>
            o.setName('الرتبة')
             .setDescription('الرتبة المخصصة لأفراد CIA')
             .setRequired(true)
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ ليس لديك صلاحية.', flags: 64 });

        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('cia_member_role', role.id);

        const embed = new EmbedBuilder()
            .setTitle('🕵️ تم تحديد رتبة أفراد CIA')
            .setColor(0x0D1B2A)
            .setDescription(`رتبة **${role.name}** هي الآن رتبة أفراد CIA.\n\nأصحاب هذه الرتبة يستطيعون تسجيل الدخول والخروج في لوحة \`/cia\`.`)
            .setFooter({ text: 'CIA • بوت FANTASY' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
