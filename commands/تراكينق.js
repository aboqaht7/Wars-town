const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder } = require('discord.js');
const { loadSystemBtns, makeBtn } = require('../btnConfig');

module.exports = {
    name: 'تراكينق',
    data: new SlashCommandBuilder()
        .setName('تراكينق')
        .setDescription('عرض لوحة التراكينق (لأعضاء CIA فقط)'),

    async slashExecute(interaction, db) {
        const ciaRoleId = await db.getConfig('cia_chef_role');
        if (!ciaRoleId) {
            return interaction.reply({ content: '⚠️ لم يتم تعيين رتبة CIA بعد. على الأدمن استخدام `/تعيين-رتبة-cia` أولاً.', flags: 64 });
        }
        if (!interaction.member.roles.cache.has(ciaRoleId)) {
            return interaction.reply({ content: '❌ هذا الأمر لأعضاء CIA فقط.', flags: 64 });
        }

        const t = await loadSystemBtns(db, 'cia_tracking');

        const embed = new EmbedBuilder()
            .setTitle('🎯 لوحة التراكينق — CIA')
            .setColor(0x0D1B2A)
            .setDescription(
                '**🎯 تراكينق** — تتبّع مواطن عادي (تبريد ساعتان لكل عميل)\n' +
                '**👑 تراكينق للرؤساء** — تتبّع رتبة محمية (مرتان شهرياً فقط)\n\n' +
                '> اختر الزر المناسب لفتح نافذة الإدخال.'
            )
            .setFooter({ text: 'CIA • FANTASY Bot' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            makeBtn('tracking_btn',           t.normal),
            makeBtn('tracking_president_btn', t.president),
        );

        await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    },
};
