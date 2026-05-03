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
            return interaction.reply({ content: '❌ You do not have permission.', flags: 64 });

        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('cia_member_role', role.id);

        const _img = await db.getImage('admin').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('CIA Members Role Set')
            .setColor(0xE53935)
            .setDescription(`Role **${role.name}** is now the CIA Members role.\n\nMembers with this role can sign in and out of the \`/cia\` dashboard.`)
            .setFooter({ text: 'CIA • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);
        if (_img) embed.setImage(_img);
        return interaction.reply({ embeds: [embed] });
    },
};
