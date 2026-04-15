const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');

module.exports = {
    name: 'شركة',
    data: new SlashCommandBuilder()
        .setName('شركة')
        .setDescription('Company System — Submit Establishment Request أو عرض معلومات شركتك'),

    async slashExecute(interaction, db) {
        const company = await db.getUserCompany(interaction.user.id);

        if (company) {
            const members = await db.getCompanyMembers(company.id);
            const memberList = members.length
                ? members.map(m => `<@${m.discord_id}> — **${m.role}**`).join('\n')
                : '_No employees_';

            const _img = await db.getImage('market').catch(() => null);


            const embed = new EmbedBuilder()
                .setTitle(`🏢 ${company.name}`)
                .setColor(0x1565C0)
                .addFields(
                    { name: '👑 Owner', value: `<@${company.owner_discord_id}>`, inline: true },
                    { name: '💰 Company Balance', value: `\`${(company.balance || 0).toLocaleString()} ريال\``, inline: true },
                    { name: '🏷️ Your Rank', value: `**${company.userRole}**`, inline: true },
                    { name: `👥 الموظفون (${members.length})`, value: memberList, inline: false },
                )
                .setFooter({ text: 'Company System • FANTASY Bot' })
                .setTimestamp();

            await interaction.reply({ content: '\u200b', flags: 64 });
            if (_img) embed.setImage(_img);
            return interaction.channel.send({ embeds: [embed] });
        }

        const _img = await db.getImage('market').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Company System')
            .setColor(0x1565C0)
            .setDescription(
                '**Welcome to the Company System!**\n\n' +
                '📋 To apply for a new company, press the button below.\n\n' +
                '**Requirements:**\n' +
                '• You must have a **commercial permit** from the Ministry of Commerce\n' +
                '• Bank balance of at least **50,000 SAR**\n' +
                '• Must not be associated with another company'
            )
            .setFooter({ text: 'Company System • FANTASY Bot' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('company_apply_btn')
                .setLabel('Submit Establishment Request').setEmoji('📋')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('company_list_btn')
                .setLabel('Company List').setEmoji('📋')
                .setStyle(ButtonStyle.Secondary),
        );

        await interaction.reply({ content: '\u200b', flags: 64 });
        if (_img) embed.setImage(_img);
        return interaction.channel.send({ embeds: [embed], components: [row] });
    },
};
