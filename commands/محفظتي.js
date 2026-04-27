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
        .setDescription('View your investment stock portfolio'),

    async slashExecute(interaction, db) {
        const loginErr = await db.checkLoginAndIdentity(interaction.user.id);
        if (loginErr) return interaction.reply({ content: loginErr, flags: 64 });
        const identity = await db.getActiveIdentity(interaction.user.id);

        const portfolio = await db.getUserPortfolio(interaction.user.id);
        if (!portfolio.length)
            return interaction.reply({ content: '📭 Your portfolio is empty — you have no shares at the moment.', flags: 64 });

        let totalValue = 0;
        let totalCost  = 0;

        const _img = await db.getImage('market').catch(() => null);

        const embed = new EmbedBuilder()
            .setColor(0x0A1628)
            .setTitle('Your Investment Portfolio')
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
                    `Shares  : ${p.shares} shares`,
                    `Price   : ${curr.toFixed(2)} Riyals / share`,
                    `Value   : ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} Riyals`,
                    `P&L     : ${plSign}${pl.toLocaleString(undefined, { maximumFractionDigits: 0 })} Riyals  (${plSign}${plPct}%)  ${arrow}`,
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
                `Total Value  : ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} Riyals`,
                `Total P&L    : ${totalSign}${totalPl.toLocaleString(undefined, { maximumFractionDigits: 0 })} Riyals  (${totalSign}${totalPlPct}%)  ${totalArrow}`,
                '```'
            ].join('\n'),
            inline: false
        });

        embed
            .setFooter({ text: 'FANTASY Stock Exchange • Prices as of last market update' })
            .setTimestamp();

        await interaction.reply({ content: '\u200b', flags: 64 });
        if (_img) embed.setImage(_img);
        return interaction.channel.send({ embeds: [embed] });
    }
};
