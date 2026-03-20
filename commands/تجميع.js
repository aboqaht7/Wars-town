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
        .setDescription('اضغط على الزر أدناه لجمع موارد عشوائية تُضاف لحقيبتك مباشرة.')
        .setColor(0x2ecc71);
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
        const identity = await db.getActiveIdentity(interaction.user.id);
        if (!identity) return interaction.reply({ content: 'ماسجلت دخولك؟سجل دخولك يالامير بعدين تعال', flags: 64 });

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
