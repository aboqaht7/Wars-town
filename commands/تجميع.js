const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const RESOURCES = [
    { name: 'ألمنيوم', emoji: '🔩' },
    { name: 'حديد',    emoji: '⚙️' },
    { name: 'خشب',     emoji: '🪵' },
    { name: 'أربطة',   emoji: '🪢' },
    { name: 'مسامير',  emoji: '📌' },
];

function buildEmbed() {
    return new EmbedBuilder()
        .setTitle('🪛 نظام التجميع')
        .setDescription(
            '> اضغط على الزر أدناه لجمع موارد عشوائية تُضاف لحقيبتك مباشرة.\n\n' +
            '**الموارد المتاحة:**\n' +
            RESOURCES.map(r => `> ${r.emoji} **${r.name}**`).join('\n') + '\n\n' +
            '> ⚠️ لن تحصل على نفس المورد مرتين متتاليتين.'
        )
        .setColor(0x2ecc71)
        .setFooter({ text: 'الموارد تُستخدم في نظام التصنيع' });
}

function buildRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gather_resources')
            .setLabel('🪛 جمّع الموارد')
            .setStyle(ButtonStyle.Success)
    );
}

module.exports = {
    name: 'تجميع',
    data: new SlashCommandBuilder()
        .setName('تجميع')
        .setDescription('اجمع موارد عشوائية لاستخدامها في التصنيع'),

    async slashExecute(interaction, db) {
        if (interaction._isReset) {
            return interaction.message.edit({ embeds: [buildEmbed()], components: [buildRow()] });
        }
        await interaction.reply({ content: '\u200b', flags: 65 });
        await interaction.channel.send({ embeds: [buildEmbed()], components: [buildRow()] });
    },

    RESOURCES,
    buildEmbed,
    buildRow,
};
