const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');

module.exports = {
    name: 'إدارة-شركة',
    data: new SlashCommandBuilder()
        .setName('إدارة-شركة')
        .setDescription('لوحة إدارة شركتك (يتطلب رتبة مستثمر)'),

    async slashExecute(interaction, db) {
        const company = await db.getUserCompany(interaction.user.id);
        if (!company)
            return interaction.reply({ content: '❌ أنت لست مرتبطاً بأي شركة.', flags: 64 });

        const members = await db.getCompanyMembers(company.id);
        const memberList = members.length
            ? members.map(m => `<@${m.discord_id}> — **${m.role}** — راتب: \`${(m.salary || 0).toLocaleString()} ريال\``).join('\n')
            : '_لا يوجد موظفون_';

        const embed = new EmbedBuilder()
            .setTitle(`🏢 إدارة شركة ${company.name}`)
            .setColor(0x1565C0)
            .addFields(
                { name: '👑 المالك', value: `<@${company.owner_discord_id}>`, inline: true },
                { name: '💰 رصيد الشركة', value: `\`${(company.balance || 0).toLocaleString()} ريال\``, inline: true },
                { name: '🏷️ رتبتك', value: `**${company.userRole}**`, inline: true },
                { name: `👥 الموظفون (${members.length})`, value: memberList, inline: false },
            )
            .setDescription('اختر أحد الخيارات أدناه لإدارة شركتك.')
            .setFooter({ text: 'نظام الشركات • بوت FANTASY' })
            .setTimestamp();

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('comp_deposit_btn').setLabel('💵 إيداع').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('comp_withdraw_btn').setLabel('💸 سحب').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('comp_hire_btn').setLabel('📄 تعيين موظف').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('comp_fire_btn').setLabel('🧾 إقالة موظف').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('comp_dissolve_btn').setLabel('📜 حل الشركة').setStyle(ButtonStyle.Danger),
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('comp_promote_btn').setLabel('⬆️ ترقية موظف').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('comp_paysalaries_btn').setLabel('💰 إيداع الرواتب').setStyle(ButtonStyle.Success),
        );

        return interaction.reply({ embeds: [embed], components: [row1, row2], flags: 64 });
    },
};
