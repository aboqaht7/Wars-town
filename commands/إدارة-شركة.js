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
        const investorRoleId = await db.getConfig('investor_role');
        const isAdmin = interaction.member.permissions.has(require('discord.js').PermissionFlagsBits.Administrator);
        const hasInvestorRole = investorRoleId && interaction.member.roles.cache.has(investorRoleId);

        if (!isAdmin && !hasInvestorRole)
            return interaction.reply({ content: '❌ هذا الأمر لأصحاب رتبة **مستثمر** فقط.', flags: 64 });

        const company = await db.getUserCompany(interaction.user.id);
        if (!company)
            return interaction.reply({ content: '❌ أنت لست مرتبطاً بأي شركة.', flags: 64 });

        const members = await db.getCompanyMembers(company.id);
        const memberList = members.length
            ? members.map(m => `<@${m.discord_id}> — **${m.role}**`).join('\n')
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

        return interaction.reply({ embeds: [embed], components: [row1], flags: 64 });
    },
};
