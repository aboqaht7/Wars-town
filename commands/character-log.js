const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const ACTION_LABELS = {
    login:             '✅ تسجيل دخول',
    logout:            '🚪 تسجيل خروج',
    hurricane_logout:  '🌀 خروج تلقائي (إعصار)',
    trip_logout:       '✈️ خروج (إغلاق رحلة)',
    approved:          '🟢 هوية مقبولة',
    rejected:          '🔴 هوية مرفوضة',
    pending:           '⏳ طلب هوية جديد',
};

module.exports = {
    name: 'character-log',
    data: new SlashCommandBuilder()
        .setName('character-log')
        .setDescription('سجل أحداث الشخصيات')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addIntegerOption(opt =>
            opt.setName('عدد').setDescription('عدد السجلات (افتراضي 15)').setRequired(false).setMinValue(1).setMaxValue(50))
        .addUserOption(opt =>
            opt.setName('مستخدم').setDescription('فلترة بمستخدم معين').setRequired(false)),

    async slashExecute(interaction, db) {
        const limit  = interaction.options.getInteger('عدد') || 15;
        const user   = interaction.options.getUser('مستخدم');
        const logs   = await db.getCharacterLogs(limit, user?.id);

        const embed = new EmbedBuilder()
            .setTitle('📋 سجل الشخصيات')
            .setColor(0x37474F)
            .setFooter({ text: `بوت FANTASY • آخر ${limit} سجل` })
            .setTimestamp();

        if (!logs.length) {
            embed.setDescription('> لا توجد سجلات بعد.');
        } else {
            const lines = logs.map(l => {
                const label  = ACTION_LABELS[l.action] || l.action;
                const time   = `<t:${Math.floor(new Date(l.created_at).getTime() / 1000)}:R>`;
                const charInfo = l.character_name ? ` — **${l.character_name}**` : '';
                const slot   = l.slot ? ` (شخصية ${l.slot})` : '';
                return `${label} • <@${l.discord_id}>${charInfo}${slot} ${time}`;
            });
            embed.setDescription(lines.join('\n'));
        }
        return interaction.reply({ embeds: [embed], flags: 64 });
    }
};
