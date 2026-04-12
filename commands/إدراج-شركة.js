const {
    SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits
} = require('discord.js');

module.exports = {
    name: 'إدراج-شركة',
    data: new SlashCommandBuilder()
        .setName('إدراج-شركة')
        .setDescription('إدراج شركة يدوياً في سوق الأسهم (وزارة التجارة فقط)')
        .addStringOption(opt =>
            opt.setName('اسم-الشركة')
                .setDescription('اسم الشركة كما هو مسجل في النظام')
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

        const nameInput  = interaction.options.getString('اسم-الشركة').trim();
        const ipoPrice   = interaction.options.getInteger('سعر-الإدراج')  ?? 100;
        const totalShares = interaction.options.getInteger('عدد-الأسهم') ?? 1000;

        const companies = await db.getAllCompanies();
        const match = companies.find(c =>
            c.name.toLowerCase().includes(nameInput.toLowerCase())
        );

        if (!match)
            return interaction.reply({ content: `❌ لم يتم العثور على شركة باسم **${nameInput}**.\nتأكد أن الشركة مسجلة ومقبولة من الوزارة أولاً.`, flags: 64 });

        const existing = await db.getStockListing(match.id);
        if (existing)
            return interaction.reply({
                content: `⚠️ شركة **${match.name}** مدرجة بالفعل في السوق بسعر **${parseFloat(existing.current_price).toFixed(2)} ريال**.`,
                flags: 64
            });

        await db.listCompanyOnMarket(match.id, ipoPrice, totalShares);

        const embed = new EmbedBuilder()
            .setTitle('✅ تم إدراج الشركة في سوق الأسهم')
            .setColor(0x1B5E20)
            .addFields(
                { name: '🏢 الشركة', value: `**${match.name}**`, inline: true },
                { name: '👑 المالك', value: `<@${match.owner_discord_id}>`, inline: true },
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
