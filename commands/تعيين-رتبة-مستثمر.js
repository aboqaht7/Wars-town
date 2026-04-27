const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'تعيين-رتبة-مستثمر',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-مستثمر')
        .setDescription('تحديد Rank المستثمر لإدارة الشركات (أدمن فقط)')
        .addRoleOption(o =>
            o.setName('الرتبة')
             .setDescription('الRank المخصصة للمستثمرين')
             .setRequired(true)
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ You do not have permission.', flags: 64 });

        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('investor_role', role.id);

        const _img = await db.getImage('market').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Investor Role Set')
            .setColor(0x1565C0)
            .setDescription(`Role **${role.name}** is now the Investor role.\n\nMembers with this role can use \`/إدارة-شركة\` to manage their companies.`)
            .setFooter({ text: 'Company System • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);
        if (_img) embed.setImage(_img);
        return interaction.reply({ embeds: [embed] });
    },
};
