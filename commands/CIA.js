const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
} = require('discord.js');
const { loadSystemBtns, makeBtn } = require('../btnConfig');
const { resetRow } = require('../utils');

module.exports = {
    name: 'cia',
    data: new SlashCommandBuilder()
        .setName('cia')
        .setDescription('CIA System — Login, Logout & Active Members'),
    async slashExecute(interaction, db) {
        const c = await loadSystemBtns(db, 'cia');
        const t = await loadSystemBtns(db, 'cia_tracking');

        const _img = await db.getImage('admin').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('CIA — وكالة الاستخبارات')
            .setColor(0x0D1B2A)
            .setDescription(
                '**🟢 تسجيل دخول** — سجّل حضورك كعضو CIA\n' +
                '**🔴 تسجيل خروج** — سجّل مغادرتك\n' +
                '**👥 كشف المباشرين** — عرض أعضاء CIA النشطين (للرئيس فقط)\n' +
                '**🪪 هوية مزيفة** — إصدار هوية مزيفة (للرئيس فقط)\n' +
                '**🎯 تراكينق** — تتبع مواطن (تبريد ساعتان)\n' +
                '**👑 تراكينق للرؤساء** — تتبع رتب محمية (مرتان شهرياً فقط)\n\n' +
                '> الأزرار متاحة لأعضاء CIA فقط'
            )
            .setFooter({ text: 'CIA • FANTASY Bot' })
            .setTimestamp();

        const row1 = new ActionRowBuilder().addComponents(
            makeBtn('cia_login_btn',  c.login),
            makeBtn('cia_logout_btn', c.logout),
            makeBtn('cia_active_btn', c.active),
        );

        const row2 = new ActionRowBuilder().addComponents(
            makeBtn('cia_fake_id_btn', c.fake_id),
        );

        const row3 = new ActionRowBuilder().addComponents(
            makeBtn('tracking_btn',           t.normal),
            makeBtn('tracking_president_btn', t.president),
        );

        if (_img) embed.setImage(_img);

        const payload = { embeds: [embed], components: [row1, row2, row3] };

        if (interaction._isReset) {
            return interaction.message.edit(payload);
        }
        await interaction.channel.send(payload);
        await interaction.reply({ content: '\u200b', flags: 64 });
    }
};
