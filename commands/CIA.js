const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
} = require('discord.js');
const { loadSystemBtns, makeBtn } = require('../btnConfig');

module.exports = {
    name: 'cia',
    data: new SlashCommandBuilder()
        .setName('cia')
        .setDescription('لوحة نظام CIA — تسجيل الدخول والخروج وكشف المباشرين'),
    async slashExecute(interaction, db) {
        const c = await loadSystemBtns(db, 'cia');

        const embed = new EmbedBuilder()
            .setTitle('CIA — Intelligence Agency')
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
            makeBtn('cia_login_btn',  c.login),
            makeBtn('cia_logout_btn', c.logout),
            makeBtn('cia_active_btn', c.active),
        );

        const row2 = new ActionRowBuilder().addComponents(
            makeBtn('cia_fake_id_btn', c.fake_id),
        );

        await interaction.reply({ embeds: [embed], components: [row1, row2] });
    }
};
