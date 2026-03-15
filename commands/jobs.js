const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

const COOLDOWN_SECONDS = 10;
const COOLDOWN_MINUTES = COOLDOWN_SECONDS / 60;

module.exports = {
    name: 'jobs',
    data: new SlashCommandBuilder().setName('jobs').setDescription('💼 الوظائف الحرة'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const payload = await buildJobs(db);
        message.channel.send(payload);
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const payload = await buildJobs(db);
        interaction.reply({ ...payload, flags: 64 });
    },
    buildJobs,
    COOLDOWN_MINUTES,
};

async function buildJobs(db) {
    const prices = await db.getJobPrices();
    const img    = await db.getImage('jobs');

    const fishPrices  = ['سمك هامور','سالمون','روبيان','حوت']
        .map(f => `**${f}:** ${(prices[f]||0).toLocaleString()} ريال`).join(' • ');
    const woodPrice   = `**خشب:** ${(prices['خشب']||0).toLocaleString()} ريال`;
    const minePrices  = ['الماس','ذهب','فضة','نحاس']
        .map(m => `**${m}:** ${(prices[m]||0).toLocaleString()} ريال`).join(' • ');

    const embed = new EmbedBuilder()
        .setTitle('💼 الوظائف الحرة')
        .setColor(0xF57F17)
        .addFields(
            { name: '🎣 صيد السمك  〔يتطلب: سنارة〕',            value: fishPrices,  inline: false },
            { name: '🪓 تقطيع الخشب  〔يتطلب: فأس〕',            value: woodPrice,   inline: false },
            { name: '⛏️ المنجم  〔يتطلب: أدوات المنجم〕',         value: minePrices,  inline: false },
        )
        .setDescription('> الأسعار تتجدد كل ساعة تلقائياً\n> كل وظيفة تعطيك كمية عشوائية من ١ إلى ١٠')
        .setFooter({ text: `نظام الوظائف • بوت FANTASY • كولداون ${COOLDOWN_SECONDS} ثوان بين كل وظيفة` })
        .setTimestamp();
    if (img) embed.setImage(img);

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('jobs_menu')
            .setPlaceholder('اختر وظيفتك')
            .addOptions([
                { label: '🎣 صيد السمك',      value: 'fishing',     description: 'يتطلب: سنارة' },
                { label: '🪓 تقطيع الخشب',    value: 'woodcutting', description: 'يتطلب: فأس' },
                { label: '⛏️ المنجم',          value: 'mining',      description: 'يتطلب: أدوات المنجم' },
                { label: '💰 بيع مكاسبي',     value: 'sell',        description: 'بيع كل السمك والخشب والمعادن' },
            ])
    );

    return { embeds: [embed], components: [menu, resetRow('jobs')] };
}
