const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');

module.exports = {
    name: 'شركة',
    data: new SlashCommandBuilder()
        .setName('شركة')
        .setDescription('نظام الشركات — تقديم طلب تأسيس أو عرض معلومات شركتك'),

    async slashExecute(interaction, db) {
        const company = await db.getUserCompany(interaction.user.id);

        if (company) {
            const members = await db.getCompanyMembers(company.id);
            const memberList = members.length
                ? members.map(m => `<@${m.discord_id}> — **${m.role}**`).join('\n')
                : '_لا يوجد موظفون_';

            const embed = new EmbedBuilder()
                .setTitle(`🏢 ${company.name}`)
                .setColor(0x1565C0)
                .addFields(
                    { name: '👑 المالك', value: `<@${company.owner_discord_id}>`, inline: true },
                    { name: '💰 رصيد الشركة', value: `\`${(company.balance || 0).toLocaleString()} ريال\``, inline: true },
                    { name: '🏷️ رتبتك', value: `**${company.userRole}**`, inline: true },
                    { name: `👥 الموظفون (${members.length})`, value: memberList, inline: false },
                )
                .setFooter({ text: 'نظام الشركات • بوت FANTASY' })
                .setTimestamp();

            await interaction.reply({ content: '\u200b', flags: 64 });
            return interaction.channel.send({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setTitle('🏢 نظام الشركات')
            .setColor(0x1565C0)
            .setDescription(
                '**مرحباً بك في نظام الشركات!**\n\n' +
                '📋 للتقديم على تأسيس شركة جديدة، اضغط على الزر أدناه.\n\n' +
                '**الشروط:**\n' +
                '• يجب أن تملك **تصريح تجاري** من وزارة التجارة\n' +
                '• رصيد بنكي لا يقل عن **50,000 ريال**\n' +
                '• ألّا تكون مرتبطاً بشركة أخرى'
            )
            .setFooter({ text: 'نظام الشركات • بوت FANTASY' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('company_apply_btn')
                .setLabel('📋 تقديم طلب تأسيس')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('company_list_btn')
                .setLabel('📋 قائمة الشركات')
                .setStyle(ButtonStyle.Secondary),
        );

        await interaction.reply({ content: '\u200b', flags: 64 });
        return interaction.channel.send({ embeds: [embed], components: [row] });
    },
};
