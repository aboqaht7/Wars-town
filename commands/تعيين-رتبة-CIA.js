const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'تعيين-رتبة-cia',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-cia')
        .setDescription('تحديد رتبة CIA Chef (أدمن فقط)')
        .addRoleOption(o =>
            o.setName('الرتبة')
             .setDescription('الرتبة المخصصة لأعضاء CIA')
             .setRequired(true)
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ ليس لديك صلاحية.', flags: 64 });

        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('cia_chef_role', role.id);

        const embed = new EmbedBuilder()
            .setTitle('🕵️ تم تحديد رتبة CIA')
            .setColor(0x0D1B2A)
            .setDescription(`رتبة **${role.name}** هي الآن رتبة CIA Chef.\n\nأصحاب هذه الرتبة يستطيعون استخدام أزرار لوحة \`/cia\`.`)
            .setFooter({ text: 'CIA • بوت FANTASY' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
