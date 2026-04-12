const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'محفظتي',
    data: new SlashCommandBuilder()
        .setName('محفظتي')
        .setDescription('عرض محفظة أسهمك الشخصية'),

    async slashExecute(interaction, db) {
        const identity = await db.checkLoginAndIdentity(interaction.user.id);
        if (!identity) return interaction.reply({ content: 'ماسجلت دخولك؟سجل دخولك يالامير بعدين تعال', flags: 64 });

        const portfolio = await db.getUserPortfolio(interaction.user.id);
        if (!portfolio.length)
            return interaction.reply({ content: '📭 محفظتك فارغة — ليس لديك أي أسهم حالياً.', flags: 64 });

        let totalValue = 0;
        let desc = '';
        for (const p of portfolio) {
            const value = parseFloat(p.current_price) * p.shares;
            totalValue += value;
            const profitLoss = value - (parseFloat(p.ipo_price) * p.shares);
            const plStr = profitLoss >= 0
                ? `🟢 +${profitLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })} ريال`
                : `🔴 ${profitLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })} ريال`;
            desc += `**🏢 ${p.company_name}**\n`;
            desc += `📦 الأسهم: \`${p.shares}\` × \`${parseFloat(p.current_price).toFixed(0)} ريال\` = **${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ريال**\n`;
            desc += `📊 ربح/خسارة: ${plStr}\n\n`;
        }

        const embed = new EmbedBuilder()
            .setTitle('💼 محفظتك الاستثمارية')
            .setColor(0x1B5E20)
            .setDescription(desc)
            .addFields({ name: '💰 إجمالي قيمة المحفظة', value: `\`${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ريال\`` })
            .setFooter({ text: 'سوق الأسهم • بوت FANTASY' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed], flags: 64 });
    }
};
