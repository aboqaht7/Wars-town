const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'سوق-مركزي',
    data: new SlashCommandBuilder().setName('سوق-مركزي').setDescription('🏪 السوق المركزي — بيع الأسماك والأخشاب والمعادن'),

    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const payload = await buildMarket(db);
        message.channel.send(payload);
    },

    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const payload = await buildMarket(db);
        if (interaction._isReset) return interaction.message.edit(payload);
        await interaction.channel.send(payload);
        await interaction.reply({ content: '​', flags: 64 });
    },

    buildMarket,
};

async function buildMarket(db) {
    const prices = await db.getJobPrices();
    const img    = await db.getImage('سوق-مركزي');

    const fmt = (name) => `${(prices[name] || 0).toLocaleString()} ريال`;

    const embed = new EmbedBuilder()
        .setTitle('🏪 السوق المركزي')
        .setColor(0x00796B)
        .setDescription('> اختر الفئة التي تريد بيعها من القائمة\n> الأسعار تتجدد كل ساعة تلقائياً\n\u200B')
        .addFields(
            {
                name: '🎣 الأسماك',
                value: [
                    `🐟 روبيان — **${fmt('روبيان')}**`,
                    `🐟 سالمون — **${fmt('سالمون')}**`,
                    `🐟 سمك هامور — **${fmt('سمك هامور')}**`,
                    `🐳 حوت — **${fmt('حوت')}**`,
                ].join('\n'),
                inline: true,
            },
            {
                name: '🪓 الأخشاب',
                value: `🪵 خشب — **${fmt('خشب')}**`,
                inline: true,
            },
            {
                name: '⛏️ المعادن',
                value: [
                    `🟤 نحاس — **${fmt('نحاس')}**`,
                    `⚪ فضة — **${fmt('فضة')}**`,
                    `🟡 ذهب — **${fmt('ذهب')}**`,
                    `💎 الماس — **${fmt('الماس')}**`,
                ].join('\n'),
                inline: true,
            },
        )
        .setFooter({ text: 'السوق المركزي • بوت FANTASY' })
        .setTimestamp();

    if (img) embed.setImage(img);

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('central_market_sell')
            .setPlaceholder('🏪 اختر ما تريد بيعه')
            .addOptions([
                { label: '🎣 بيع كل الأسماك',    value: 'fishing',     description: 'روبيان • سالمون • هامور • حوت' },
                { label: '🪓 بيع كل الأخشاب',    value: 'woodcutting', description: 'خشب' },
                { label: '⛏️ بيع كل المعادن',    value: 'mining',      description: 'نحاس • فضة • ذهب • الماس' },
                { label: '💰 بيع الكل دفعة واحدة', value: 'all',        description: 'بيع جميع مكاسب الوظائف' },
            ])
    );

    return { embeds: [embed], components: [menu, resetRow('سوق-مركزي')] };
}
