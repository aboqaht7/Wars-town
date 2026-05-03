const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');

module.exports = {
    name: 'إدارة-شركة',
    data: new SlashCommandBuilder()
        .setName('إدارة-شركة')
        .setDescription('Your company management panel (requires investor rank)'),

    async slashExecute(interaction, db) {
        const company = await db.getUserCompany(interaction.user.id);
        if (!company)
            return interaction.reply({ content: '❌ You are not associated with any company.', flags: 64 });

        const members = await db.getCompanyMembers(company.id);
        const memberList = members.length
            ? members.map(m => `<@${m.discord_id}> — **${m.role}** — Salary: \`${(m.salary || 0).toLocaleString()} Riyals\``).join('\n')
            : '_No employees_';

        const _img = await db.getImage('market').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle(`🏢 Manage Company — ${company.name}`)
            .setColor(0xE53935)
            .addFields(
                { name: '👑 Owner', value: `<@${company.owner_discord_id}>`, inline: true },
                { name: '💰 Company Balance', value: `\`${(company.balance || 0).toLocaleString()} Riyals\``, inline: true },
                { name: '🏷️ Your Rank', value: `**${company.userRole}**`, inline: true },
                { name: `👥 Employees (${members.length})`, value: memberList, inline: false },
            )
            .setDescription('Choose one of the options below to manage your company.')
            .setFooter({ text: 'Company System • FANTASY Bot' })
            .setTimestamp();

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('comp_deposit_btn').setLabel('Deposit').setEmoji('💵').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('comp_withdraw_btn').setLabel('Withdraw').setEmoji('💸').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('comp_hire_btn').setLabel('Hire Employee').setEmoji('📄').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('comp_fire_btn').setLabel('Fire Employee').setEmoji('🧾').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('comp_dissolve_btn').setLabel('Dissolve Company').setEmoji('📜').setStyle(ButtonStyle.Danger),
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('comp_promote_btn').setLabel('Promote Employee').setEmoji('⬆️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('comp_paysalaries_btn').setLabel('Pay Salaries').setEmoji('💰').setStyle(ButtonStyle.Success),
        );

        await interaction.reply({ content: '\u200b', flags: 64 });
        if (_img) embed.setImage(_img);
        return interaction.channel.send({ embeds: [embed], components: [row1, row2] });
    },
};
