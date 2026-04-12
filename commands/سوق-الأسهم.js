const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');

module.exports = {
    name: 'سوق-الأسهم',
    data: new SlashCommandBuilder()
        .setName('سوق-الأسهم')
        .setDescription('عرض سوق الأسهم لشركات Fantasy Town'),

    async slashExecute(interaction, db) {
        const listings = await db.getAllStockListings();

        if (!listings.length) {
            return interaction.reply({
                content: '📭 لا توجد شركات مدرجة في سوق الأسهم حالياً.',
                flags: 64
            });
        }

        let desc = '';
        for (const s of listings) {
            const history = await db.getStockHistory(s.company_id, 2);
            let changeStr = '';
            if (history.length >= 2) {
                const change = parseFloat(s.current_price) - parseFloat(history[1].price);
                const pct = ((change / parseFloat(history[1].price)) * 100).toFixed(1);
                changeStr = change >= 0
                    ? `🟢 +${change.toFixed(2)} (+${pct}%)`
                    : `🔴 ${change.toFixed(2)} (${pct}%)`;
            } else {
                changeStr = '⚪ جديد';
            }
            desc += `**🏢 ${s.company_name}**\n`;
            desc += `💰 السعر: \`${parseFloat(s.current_price).toLocaleString()} ريال\` — ${changeStr}\n`;
            desc += `📦 الأسهم المتاحة: \`${s.avail_shares.toLocaleString()} / ${s.total_shares.toLocaleString()}\`\n\n`;
        }

        const embed = new EmbedBuilder()
            .setTitle('📈 سوق أسهم Fantasy Town')
            .setColor(0x1565C0)
            .setDescription(desc)
            .setFooter({ text: `${listings.length} شركة مدرجة • الأسعار تتحدث تلقائياً • بوت FANTASY` })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('stock_buy_btn')
                .setLabel('📈 شراء أسهم')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('stock_sell_btn')
                .setLabel('📉 بيع أسهم')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('stock_portfolio_btn')
                .setLabel('💼 محفظتي')
                .setStyle(ButtonStyle.Primary),
        );

        return interaction.reply({ embeds: [embed], components: [row] });
    }
};
