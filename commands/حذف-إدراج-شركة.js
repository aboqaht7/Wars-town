const {
    SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits
} = require('discord.js');

function normalizeAr(str) {
    if (!str) return '';
    return str.trim()
        .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '').replace(/\s+/g, ' ').toLowerCase();
}

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
            return interaction.reply({ content: '❌ This command is for Ministry of Commerce admins only.', flags: 64 });

        const nameInput = interaction.options.getString('اسم-الشركة').trim();

        const listings = await db.getAllStockListings();
        const match = listings.find(l =>
            normalizeAr(l.company_name).includes(normalizeAr(nameInput))
        );

        if (!match)
            return interaction.reply({
                content: `❌ No listed company found with name **${nameInput}** in the market.`,
                flags: 64
            });

        await db.delistCompany(match.company_id);

        const _img = await db.getImage('market').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Company Removed from Stock Market')
            .setColor(0xE53935)
            .addFields(
                { name: '🏢 Company',    value: `**${match.company_name}**`, inline: true },
                { name: '💰 Last Price', value: `\`${parseFloat(match.current_price).toFixed(2)} Riyals\``, inline: true },
                { name: '🗑️ Removed By', value: `<@${interaction.user.id}>`, inline: true },
            )
            .setDescription('This company\'s shares have been delisted. Existing portfolios are unaffected but shares can no longer be bought or sold.')
            .setFooter({ text: 'FANTASY Stock Exchange • Ministry of Commerce' })
            .setTimestamp();

        await interaction.reply({ content: '\u200b', flags: 64 });
        if (_img) embed.setImage(_img);
        return interaction.channel.send({ embeds: [embed] });
    }
};
