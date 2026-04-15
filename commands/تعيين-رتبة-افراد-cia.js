const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'تعيين-رتبة-افراد-cia',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-افراد-cia')
        .setDescription('تحديد Rank أفراد CIA (أدمن فقط)')
        .addRoleOption(o =>
            o.setName('الرتبة')
             .setDescription('الRank المخصصة لأفراد CIA')
             .setRequired(true)
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ ليس لديك صلاحية.', flags: 64 });

        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('cia_member_role', role.id);

        const _img = await db.getImage('admin').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('CIA Members Role Set')
            .setColor(0x0D1B2A)
            .setDescription(`Rank **${role.name}** هي الآن Rank أفراد CIA.\n\nأصحاب هذه الRank يستطيعون تسجيل الدخول والخروج في لوحة \`/cia\`.`)
            .setFooter({ text: 'CIA • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);
        if (_img) embed.setImage(_img);
        return interaction.reply({ embeds: [embed] });
    },
};
