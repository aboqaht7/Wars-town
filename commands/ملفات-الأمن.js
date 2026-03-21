const {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} = require('discord.js');

module.exports = {
    name: 'ملفات-الأمن',
    data: new SlashCommandBuilder()
        .setName('ملفات-الأمن')
        .setDescription('لوحة نظام ملفات الأمن والتراكينق'),
    async execute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ نظام ملفات الأمن')
            .setColor(0x1A237E)
            .setDescription(
                '**📋 كشف ملفات المواطنين** — عرض هويات وسوابق جميع المواطنين\n' +
                '**📡 تراكينق** — تتبع شخص لمدة 20 ثانية'
            )
            .setFooter({ text: 'نظام الأمن • بوت FANTASY' })
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
