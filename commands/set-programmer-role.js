const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
const resetRow = new ActionRowBuilder().addComponents(resetButton);

module.exports = {
    name: 'تعيين-رتبة-مبرمج',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-مبرمج')
        .setDescription('تعيين رتبة المبرمج التي تتيح الوصول لجميع الأوامر')
        .addRoleOption(o => o.setName('الرتبة').setDescription('الرتبة').setRequired(true)),

    async slashExecute(interaction, db) {
        if (!interaction.member.permissions.has('Administrator'))
            return interaction.reply({ content: '❌ للإدارة فقط.', flags: 64 });
        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('programmer_role_id', role.id);
        const embed = new EmbedBuilder()
            .setTitle('✅ تم تعيين رتبة المبرمج')
            .setColor(0x6A1B9A)
            .setDescription(`أصحاب رتبة <@&${role.id}> يمتلكون الآن صلاحية الوصول لجميع الأوامر الإدارية.`)
            .setFooter({ text: 'إعدادات البوت • FANTASY' }).setTimestamp();
        await interaction.channel.send({ embeds: [embed], components: [resetRow] });
        return interaction.reply({ content: '​', flags: 64 });
    },
};
