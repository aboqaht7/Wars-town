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
        .setDescription('لوحة نظام CIA — تسجيل الدخول والخروج وكشف المباشرين'),
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('🕵️ CIA — وكالة الاستخبارات')
            .setColor(0x0D1B2A)
            .setDescription(
                '**🟢 تسجيل دخول** — سجّل حضورك كعضو CIA\n' +
                '**🔴 تسجيل خروج** — سجّل مغادرتك\n' +
                '**👥 كشف مباشرين** — عرض أعضاء CIA المباشرين (Chef فقط)\n' +
                '**🪪 هوية مزيفة** — إصدار هوية مزيفة لشخص (Chef فقط)\n\n' +
                '> الأزرار متاحة لأعضاء CIA فقط'
            )
            .setFooter({ text: 'CIA • بوت FANTASY' })
            .setTimestamp();

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('cia_login_btn')
                .setLabel('🟢 تسجيل دخول')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('cia_logout_btn')
                .setLabel('🔴 تسجيل خروج')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('cia_active_btn')
                .setLabel('👥 كشف مباشرين')
                .setStyle(ButtonStyle.Primary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('cia_fake_id_btn')
                .setLabel('🪪 إنشاء هوية مزيفة')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [embed], components: [row1, row2] });
    }
};
