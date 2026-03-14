const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'market',
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('سوق الأدوات والمزاد'),
    async execute(message, args, db) {
        const { embed, menu } = await build(db);
        message.channel.send({ embeds: [embed], components: [menu, resetRow('market')] });
    },
    async slashExecute(interaction, db) {
        const { embed, menu } = await build(db);
        interaction.reply({ embeds: [embed], components: [menu, resetRow('market')] });
    }
};

async function build(db) {
    const embed = new EmbedBuilder()
        .setTitle('🛒 السوق المركزي')
        .setColor(0xBF360C)
        .setDescription('مرحباً بك في السوق — اختر ما تريد شراءه')
        .addFields(
            { name: '🎣 أدوات الصيد', value: 'سنارة صيد متوفرة', inline: true },
            { name: '🪓 أدوات الحطب', value: 'فأس متوفر', inline: true },
            { name: '⛏️ أدوات المنجم', value: 'معاول متوفرة', inline: true },
            { name: '🔨 المزاد', value: 'سيارات وعقارات', inline: true },
        )
        .setImage(await db.getImage('market') || null)
        .setFooter({ text: 'نظام السوق • بوت FANTASY' })
        .setTimestamp();
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('market_menu')
            .setPlaceholder('اختر ما تريد شراءه')
            .addOptions([
                { label: '🎣 سنارة صيد', value: 'fishing_rod' },
                { label: '🪓 فأس', value: 'axe' },
                { label: '⛏️ أدوات منجم', value: 'mining_tools' },
                { label: '🔨 مزاد السيارات والعقارات', value: 'auction' },
            ])
    );
    return { embed, menu };
}
