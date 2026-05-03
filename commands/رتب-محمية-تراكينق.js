const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'رتب-محمية-تراكينق',
    data: new SlashCommandBuilder()
        .setName('رتب-محمية-تراكينق')
        .setDescription('إدارة الرتب المحمية من التراكينق العادي (رؤساء الحكومة) — أدمن فقط')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sc =>
            sc.setName('اضافة')
              .setDescription('إضافة رتبة لقائمة الرتب المحمية من التراكينق العادي')
              .addRoleOption(o => o.setName('الرتبة').setDescription('الرتبة المراد حمايتها').setRequired(true))
        )
        .addSubcommand(sc =>
            sc.setName('ازاله')
              .setDescription('إزالة رتبة من قائمة الرتب المحمية')
              .addRoleOption(o => o.setName('الرتبة').setDescription('الرتبة المراد إزالتها').setRequired(true))
        )
        .addSubcommand(sc =>
            sc.setName('عرض')
              .setDescription('عرض جميع الرتب المحمية حالياً')
        )
        .addSubcommand(sc =>
            sc.setName('مسح')
              .setDescription('مسح كل الرتب المحمية')
        ),

    async slashExecute(interaction, db) {
        const sub = interaction.options.getSubcommand();
        const current = await db.getTrackingProtectedRoles();

        if (sub === 'عرض') {
            if (!current.length) {
                return interaction.reply({ content: 'لا توجد رتب محمية حالياً.', flags: 64 });
            }
            const list = current.map(id => `<@&${id}>`).join('\n');
            const embed = new EmbedBuilder()
                .setTitle('الرتب المحمية من التراكينق')
                .setColor(0xE53935)
                .setDescription(list)
                .setFooter({ text: `العدد: ${current.length}` })
                .setTimestamp();
            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        if (sub === 'مسح') {
            await db.setTrackingProtectedRoles([]);
            return interaction.reply({ content: '✅ تم مسح كل الرتب المحمية.', flags: 64 });
        }

        const role = interaction.options.getRole('الرتبة');

        if (sub === 'اضافة') {
            if (current.includes(role.id)) {
                return interaction.reply({ content: `⚠️ الرتبة **${role.name}** موجودة بالفعل في القائمة.`, flags: 64 });
            }
            current.push(role.id);
            await db.setTrackingProtectedRoles(current);
            return interaction.reply({
                content: `✅ تم حماية الرتبة **${role.name}** من التراكينق العادي. سيتعين على عملاء CIA استخدام "تراكينق للرؤساء" لتتبع حامليها (مرتين فقط في الشهر).`,
                flags: 64,
            });
        }

        if (sub === 'ازاله') {
            if (!current.includes(role.id)) {
                return interaction.reply({ content: `⚠️ الرتبة **${role.name}** ليست في القائمة.`, flags: 64 });
            }
            const updated = current.filter(id => id !== role.id);
            await db.setTrackingProtectedRoles(updated);
            return interaction.reply({
                content: `✅ تم إزالة الرتبة **${role.name}** من قائمة الحماية.`,
                flags: 64,
            });
        }
    },
};
