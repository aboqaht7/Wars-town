const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder,
} = require('discord.js');

const BARS = ['▁','▂','▃','▄','▅','▆','▇','█'];

function miniChart(prices) {
    if (!prices || prices.length < 2) return '— — —';
    const vals = prices.map(p => parseFloat(p.price)).reverse();
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    return vals.map(v => BARS[Math.round(((v - min) / range) * (BARS.length - 1))]).join('');
}

function volumeBar(avail, total) {
    const sold = total - avail;
    const pct = sold / total;
    const filled = Math.round(pct * 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

function trendArrow(change) {
    if (change > 0) return '▲';
    if (change < 0) return '▼';
    return '◆';
}

async function buildMarketEmbed(db) {
    const listings = await db.getAllStockListings();
    if (!listings.length) return null;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: false });

    const _img = await db.getImage('سوق-مركزي').catch(() => null);


    const embed = new EmbedBuilder()
        .setColor(0x0A1628)
        .setTitle('Fantasy Town Stock Exchange')
        .setDescription(
            `\`\`\`yaml\n🟢 السوق: مفتوح  |  🕐 آخر تحديث: ${timeStr}  |  📋 ${listings.length} شركة مدرجة\`\`\``
        );

    for (const s of listings) {
        const history = await db.getStockHistory(s.company_id, 8);
        const prevPrice = history.length >= 2 ? parseFloat(history[1].price) : parseFloat(s.ipo_price);
        const currPrice = parseFloat(s.current_price);
        const change = currPrice - prevPrice;
        const changePct = ((change / prevPrice) * 100).toFixed(2);
        const isUp = change >= 0;
        const arrow = trendArrow(change);
        const chart = miniChart(history);
        const bar = volumeBar(s.avail_shares, s.total_shares);
        const soldPct = (((s.total_shares - s.avail_shares) / s.total_shares) * 100).toFixed(0);

        const changeDisplay = isUp
            ? `+${change.toFixed(2)} ريال (+${changePct}%) ${arrow}`
            : `${change.toFixed(2)} ريال (${changePct}%) ${arrow}`;

        embed.addFields({
            name: `${isUp ? '🟢' : '🔴'} ${s.company_name}`,
            value: [
                `\`\`\``,
                `السعر   : ${currPrice.toFixed(2)} ريال`,
                `التغيير : ${changeDisplay}`,
                `المخطط  : ${chart}`,
                `التداول : ${bar}  ${soldPct}% مُباع`,
                `الأسهم  : ${s.avail_shares.toLocaleString()} متاح / ${s.total_shares.toLocaleString()} إجمالي`,
                `\`\`\``
            ].join('\n'),
            inline: false
        });
    }

    embed
        .setFooter({ text: 'بورصة FANTASY • الأسعار تتذبذب تلقائياً كل ساعة بناءً على العرض والطلب' })
        .setTimestamp();

    const { loadSystemBtns, makeBtn } = require('../btnConfig');
    const c = await loadSystemBtns(db, 'stock');
    const row = new ActionRowBuilder().addComponents(
        makeBtn('stock_buy_btn',       c.buy),
        makeBtn('stock_sell_btn',      c.sell),
        makeBtn('stock_portfolio_btn', c.portfolio),
    );

    return { embed, row };
}

module.exports = {
    name: 'سوق-الأسهم',
    buildMarketEmbed,
    data: new SlashCommandBuilder()
        .setName('سوق-الأسهم')
        .setDescription('عرض بورصة شركات Fantasy Town'),

    async slashExecute(interaction, db) {
        const built = await buildMarketEmbed(db);

        if (!built) {
            await interaction.reply({ content: '\u200b', flags: 64 });
            return interaction.channel.send({ content: '📭 لا توجد شركات مدرجة في البورصة حالياً.' });
        }

        await interaction.reply({ content: '\u200b', flags: 64 });
        if (_img) embed.setImage(_img);
        return interaction.channel.send({ embeds: [built.embed], components: [built.row] });
    }
};
