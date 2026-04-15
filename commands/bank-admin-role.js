const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'رتبة-مسؤولين-البنك',
    data: new SlashCommandBuilder()
        .setName('رتبة-مسؤولين-البنك')
        .setDescription('تعيين رتبة مسؤولي البنك')
        .addRoleOption(opt =>
            opt.setName('رتبة').setDescription('الرتبة التي تملك صلاحيات أدمن البنك').setRequired(true)),

    async slashExecute(interaction, db) {
        const role = interaction.options.getRole('رتبة');
        await db.setConfig('bank_admin_role', role.id);

        const _img = await db.getImage('bank').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Bank Admins Role Set')
            .setColor(0x1565C0)
            .addFields(
                { name: '🛡️ الرتبة المسؤولة', value: `<@&${role.id}> — \`${role.name}\``, inline: true },
                { name: 'ℹ️ الصلاحيات', value: 'إضافة رصيد • سحب رصيد • تجميد حسابات • فك تجميد • عرض أي حساب', inline: false },
            )
            .setFooter({ text: 'نظام البنك • بوت FANTASY' })
            .setTimestamp();
        if (_img) embed.setImage(_img);
        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '​', flags: 64 });
    }
};
