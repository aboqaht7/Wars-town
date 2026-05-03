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
    name: 'إدراج-شركة',
    data: new SlashCommandBuilder()
        .setName('إدراج-شركة')
        .setDescription('إدراج شركة في سوق الأسهم يدوياً (وزارة التجارة فقط)')
        .addStringOption(opt =>
            opt.setName('اسم-الشركة')
                .setDescription('اسم الشركة — ستُنشأ تلقائياً إذا لم تكن مسجلة')
                .setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName('سعر-الإدراج')
                .setDescription('سعر السهم الابتدائي بالريال (الافتراضي: 100)')
                .setRequired(false)
                .setMinValue(1)
        )
        .addIntegerOption(opt =>
            opt.setName('عدد-الأسهم')
                .setDescription('إجمالي عدد الأسهم المتاحة (الافتراضي: 1000)')
                .setRequired(false)
                .setMinValue(10)
                .setMaxValue(100000)
        ),

    async slashExecute(interaction, db) {
        const ministryRoleId = await db.getConfig('trade_ministry_role');
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        const hasRole = ministryRoleId && interaction.member.roles.cache.has(ministryRoleId);
        if (!isAdmin && !hasRole)
            return interaction.reply({ content: '❌ This command is for Ministry of Commerce admins only.', flags: 64 });

        const nameInput   = interaction.options.getString('اسم-الشركة').trim();
        const ipoPrice    = interaction.options.getInteger('سعر-الإدراج')  ?? 100;
        const totalShares = interaction.options.getInteger('عدد-الأسهم')   ?? 1000;

        const companies = await db.getAllCompanies();
        let company = companies.find(c =>
            normalizeAr(c.name).includes(normalizeAr(nameInput))
        );

        let wasCreated = false;
        if (!company) {
            const result = await db.adminCreateCompany(nameInput, interaction.user.id);
            company = result.company;
            wasCreated = true;
        }

        const existing = await db.getStockListing(company.id);
        if (existing)
            return interaction.reply({
                content: `⚠️ Company **${company.name}** is already listed in the market at **${parseFloat(existing.current_price).toFixed(2)} Riyals**.`,
                flags: 64
            });

        await db.listCompanyOnMarket(company.id, ipoPrice, totalShares);

        const _img = await db.getImage('market').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Company Listed in Stock Market')
            .setColor(0xE53935)
            .addFields(
                { name: '🏢 Company',        value: `**${company.name}**`, inline: true },
                { name: '📋 Status',         value: wasCreated ? '🆕 Created and listed' : '✅ Listed from system', inline: true },
                { name: '💰 Listing Price',  value: `\`${ipoPrice.toLocaleString()} Riyals / share\``, inline: true },
                { name: '📦 Total Shares',   value: `\`${totalShares.toLocaleString()} shares\``, inline: true },
                { name: '💎 Market Cap',     value: `\`${(ipoPrice * totalShares).toLocaleString()} Riyals\``, inline: true },
                { name: '✅ Listed By',      value: `<@${interaction.user.id}>`, inline: true },
            )
            .setFooter({ text: 'FANTASY Stock Exchange • Ministry of Commerce' })
            .setTimestamp();

        await interaction.reply({ content: '\u200b', flags: 64 });
        if (_img) embed.setImage(_img);
        return interaction.channel.send({ embeds: [embed] });
    }
};
