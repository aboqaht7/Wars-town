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
            return interaction.reply({ content: '❌ هذا الأمر لمسؤولي وزارة التجارة فقط.', flags: 64 });

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
                content: `⚠️ شركة **${company.name}** مدرجة بالفعل في السوق بسعر **${parseFloat(existing.current_price).toFixed(2)} ريال**.`,
                flags: 64
            });

        await db.listCompanyOnMarket(company.id, ipoPrice, totalShares);

        const embed = new EmbedBuilder()
            .setTitle('تم إدراج الشركة في سوق الأسهم')
            .setColor(0x1B5E20)
            .addFields(
                { name: '🏢 الشركة', value: `**${company.name}**`, inline: true },
                { name: '📋 الحالة', value: wasCreated ? '🆕 أُنشئت وأُدرجت' : '✅ أُدرجت من النظام', inline: true },
                { name: '💰 سعر الإدراج', value: `\`${ipoPrice.toLocaleString()} ريال / سهم\``, inline: true },
                { name: '📦 إجمالي الأسهم', value: `\`${totalShares.toLocaleString()} سهم\``, inline: true },
                { name: '💎 القيمة السوقية', value: `\`${(ipoPrice * totalShares).toLocaleString()} ريال\``, inline: true },
                { name: '✅ أدرجها', value: `<@${interaction.user.id}>`, inline: true },
            )
            .setFooter({ text: 'بورصة FANTASY • وزارة التجارة' })
            .setTimestamp();

        await interaction.reply({ content: '\u200b', flags: 64 });
        return interaction.channel.send({ embeds: [embed] });
    }
};
