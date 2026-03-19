const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');

module.exports = {
    name: 'نقاط-الادارة',
    data: new SlashCommandBuilder()
        .setName('نقاط-الادارة')
        .setDescription('بانل نقاط الإدارة'),

    async execute(message, args, db) {
        const payload = buildPanel();
        await message.channel.send(payload);
    },

    async slashExecute(interaction, db) {
        await interaction.deferReply({ flags: 64 });
        await interaction.channel.send(buildPanel());
        await interaction.deleteReply().catch(() => {});
    }
};

function buildPanel() {
    const embed = new EmbedBuilder()
        .setTitle('📊 نظام نقاط الإدارة')
        .setColor(0x1565C0)
        .setDescription(
            '> اضغط على الزر المناسب لعرض أو تعديل نقاط الإدارة.\n\n' +
            '🗂️ **مصادر النقاط:**\n' +
            '> 🚀 فتح رحلة — **5 نقاط**\n' +
            '> 👁️ حضور رقابة (GMC) — **8 نقاط**\n' +
            '> 🎫 استلام تكت — **5 نقاط**\n' +
            '> ✏️ نقاط مضافة يدوياً'
        )
        .setFooter({ text: 'نظام نقاط الإدارة • بوت FANTASY' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('points_check')
            .setLabel('📋 كشف نقاطي')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('points_add_btn')
            .setLabel('➕ إضافة نقاط')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('points_deduct_btn')
            .setLabel('➖ خصم نقاط')
            .setStyle(ButtonStyle.Danger),
    );

    return { embeds: [embed], components: [row] };
}
