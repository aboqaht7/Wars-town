const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function trendArrow(pl) {
    if (pl > 0) return '▲';
    if (pl < 0) return '▼';
    return '◆';
}

module.exports = {
    name: 'محفظتي',
    data: new SlashCommandBuilder()
        .setName('محفظتي')
        .setDescription('عرض محفظة أسهمك الاستثمارية'),

    async slashExecute(interaction, db) {
        const loginErr = await db.checkLoginAndIdentity(interaction.user.id);
        if (loginErr) return interaction.reply({ content: loginErr, flags: 64 });
        const identity = await db.getActiveIdentity(interaction.user.id);

        const portfolio = await db.getUserPortfolio(interaction.user.id);
        if (!portfolio.length)
            return interaction.reply({ content: '📭 محفظتك فارغة — ليس لديك أي أسهم حالياً.', flags: 64 });

        let totalValue = 0;
        let totalCost  = 0;

        const embed = new EmbedBuilder()
            .setColor(0x0A1628)
            .setTitle('💼 محفظتك الاستثمارية')
            .setDescription(`\`\`\`yaml\n👤 ${identity.name}  |  🪪 ${identity.iban}\`\`\``);

        for (const p of portfolio) {
            const curr   = parseFloat(p.current_price);
            const ipo    = parseFloat(p.ipo_price);
            const value  = curr * p.shares;
            const cost   = ipo  * p.shares;
            const pl     = value - cost;
            const plPct  = ((pl / cost) * 100).toFixed(2);
            totalValue  += value;
            totalCost   += cost;

            const arrow  = trendArrow(pl);
            const plSign = pl >= 0 ? '+' : '';

            embed.addFields({
                name: `${pl >= 0 ? '🟢' : '🔴'} ${p.company_name}`,
                value: [
                    '```',
                    `الأسهم  : ${p.shares} سهم`,
                    `السعر   : ${curr.toFixed(2)} ريال / سهم`,
                    `القيمة  : ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ريال`,
                    `الربح   : ${plSign}${pl.toLocaleString(undefined, { maximumFractionDigits: 0 })} ريال  (${plSign}${plPct}%)  ${arrow}`,
                    '```'
                ].join('\n'),
                inline: false
            });
        }

        const totalPl    = totalValue - totalCost;
        const totalPlPct = totalCost > 0 ? ((totalPl / totalCost) * 100).toFixed(2) : '0.00';
        const totalSign  = totalPl >= 0 ? '+' : '';
        const totalArrow = trendArrow(totalPl);

        embed.addFields({
            name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            value: [
                '```yaml',
                `إجمالي القيمة  : ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ريال`,
                `إجمالي الربح   : ${totalSign}${totalPl.toLocaleString(undefined, { maximumFractionDigits: 0 })} ريال  (${totalSign}${totalPlPct}%)  ${totalArrow}`,
                '```'
            ].join('\n'),
            inline: false
        });

        embed
            .setFooter({ text: 'بورصة FANTASY • الأسعار حسب آخر تحديث في السوق' })
            .setTimestamp();

        await interaction.reply({ content: '\u200b', flags: 64 });
        return interaction.channel.send({ embeds: [embed] });
    }
};
