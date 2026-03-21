const {
    SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits,
    ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');

module.exports = {
    name: 'وزارة-التجارة',
    data: new SlashCommandBuilder()
        .setName('وزارة-التجارة')
        .setDescription('لوحة تحكم وزارة التجارة'),

    async slashExecute(interaction, db) {
        const duty = await db.getMinistryDuty(interaction.user.id);
        const isOnDuty = duty?.status === 'on';

        const embed = new EmbedBuilder()
            .setTitle('🏛️ وزارة التجارة')
            .setColor(0x1565C0)
            .setDescription('مرحباً بك في لوحة تحكم وزارة التجارة. اختر أحد الخيارات أدناه.')
            .addFields(
                { name: '👤 المسؤول', value: `<@${interaction.user.id}>`, inline: true },
                { name: '🟢 حالة الدوام', value: isOnDuty ? '**متواجد**' : '**غير متواجد**', inline: true },
            )
            .setFooter({ text: 'وزارة التجارة • بوت FANTASY' })
            .setTimestamp();

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ministry_login_btn').setLabel('🟢 تسجيل دخول').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ministry_logout_btn').setLabel('🔴 تسجيل خروج').setStyle(ButtonStyle.Danger),
        );
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ministry_companies_btn').setLabel('🏢 عرض الشركات المسجلة').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ministry_approve_btn').setLabel('✅ قبول شركة').setStyle(ButtonStyle.Success),
        );

        return interaction.reply({ embeds: [embed], components: [row1, row2], flags: 64 });
    },
};
