const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'تعيين-رتبة-cia',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-cia')
        .setDescription('تحديد Rank CIA Chef (أدمن فقط)')
        .addRoleOption(o =>
            o.setName('الرتبة')
             .setDescription('الRank المخصصة لأعضاء CIA')
             .setRequired(true)
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ You do not have permission.', flags: 64 });

        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('cia_chef_role', role.id);

        const _img = await db.getImage('admin').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('CIA Role Set')
            .setColor(0xE53935)
            .setDescription(`Role **${role.name}** is now the CIA Chef role.\n\nMembers with this role can use the \`/cia\` dashboard buttons.`)
            .setFooter({ text: 'CIA • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);
        if (_img) embed.setImage(_img);
        return interaction.reply({ embeds: [embed] });
    },
};
