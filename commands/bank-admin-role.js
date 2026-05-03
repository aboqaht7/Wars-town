const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'رتبة-مسؤولين-بنك',
    data: new SlashCommandBuilder()
        .setName('رتبة-مسؤولين-بنك')
        .setDescription('Set bank admin role')
        .addRoleOption(opt =>
            opt.setName('الرتبة').setDescription('The role with bank admin permissions').setRequired(true)),

    async slashExecute(interaction, db) {
        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('bank_admin_role', role.id);

        const _img = await db.getImage('bank').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Bank Admins Role Set')
            .setColor(0xE53935)
            .addFields(
                { name: '🛡️ الRank المسؤولة', value: `<@&${role.id}> — \`${role.name}\``, inline: true },
                { name: 'ℹ️ الصلاحيات', value: 'إضافة رصيد • سحب رصيد • تجميد حسابات • فك تجميد • عرض أي حساب', inline: false },
            )
            .setFooter({ text: 'Bank System • FANTASY Bot' })
            .setTimestamp();
        if (_img) embed.setImage(_img);
        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '​', flags: 64 });
    }
};
