const {
    SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits
} = require('discord.js');

module.exports = {
    name: 'حذف-إدراج-شركة',
    data: new SlashCommandBuilder()
        .setName('حذف-إدراج-شركة')
        .setDescription('حذف شركة من سوق الأسهم (وزارة التجارة فقط)')
        .addStringOption(opt =>
            opt.setName('اسم-الشركة')
                .setDescription('اسم الشركة المدرجة في السوق أو جزء منه')
                .setRequired(true)
        ),

    async slashExecute(interaction, db) {
        const ministryRoleId = await db.getConfig('trade_ministry_role');
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        const hasRole = ministryRoleId && interaction.member.roles.cache.has(ministryRoleId);
        if (!isAdmin && !hasRole)
            return interaction.reply({ content: '❌ هذا الأمر لمسؤولي وزارة التجارة فقط.', flags: 64 });

        const nameInput = interaction.options.getString('اسم-الشركة').trim();

        const listings = await db.getAllStockListings();
        const match = listings.find(l =>
            l.company_name.toLowerCase().includes(nameInput.toLowerCase())
        );

        if (!match)
            return interaction.reply({
                content: `❌ لم يتم العثور على شركة مدرجة باسم **${nameInput}** في السوق.`,
                flags: 64
            });

        await db.delistCompany(match.company_id);

        const embed = new EmbedBuilder()
            .setTitle('🗑️ تم حذف الشركة من سوق الأسهم')
            .setColor(0xB71C1C)
            .addFields(
                { name: '🏢 الشركة', value: `**${match.company_name}**`, inline: true },
                { name: '💰 آخر سعر', value: `\`${parseFloat(match.current_price).toFixed(2)} ريال\``, inline: true },
                { name: '🗑️ حذفها', value: `<@${interaction.user.id}>`, inline: true },
            )
            .setDescription('تم إيقاف تداول أسهم هذه الشركة. المحافظ الحالية لن تتأثر ولكن لن يمكن شراء أو بيع أسهمها.')
            .setFooter({ text: 'بورصة FANTASY • وزارة التجارة' })
            .setTimestamp();

        await interaction.reply({ content: '\u200b', flags: 64 });
        return interaction.channel.send({ embeds: [embed] });
    }
};
