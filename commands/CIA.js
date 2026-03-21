const {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} = require('discord.js');

module.exports = {
    name: 'cia',
    data: new SlashCommandBuilder()
        .setName('cia')
        .setDescription('لوحة نظام CIA — ملفات المواطنين والتراكينق'),
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('🕵️ CIA — وكالة الاستخبارات')
            .setColor(0x0D1B2A)
            .setDescription(
                '**📋 كشف ملفات المواطنين** — عرض هويات وسوابق جميع المواطنين\n' +
                '**📡 تراكينق** — تتبع شخص لمدة 20 ثانية\n\n' +
                '> الأزرار متاحة لأعضاء CIA فقط'
            )
            .setFooter({ text: 'CIA • بوت FANTASY' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('security_files_btn')
                .setLabel('📋 كشف ملفات المواطنين')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('tracking_btn')
                .setLabel('📡 تراكينق')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
