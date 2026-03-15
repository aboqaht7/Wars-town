const {
    SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits,
    ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');

const ACTION_LABELS = {
    login:            '✅ تسجيل دخول',
    logout:           '🚪 تسجيل خروج',
    hurricane_logout: '🌪️ خروج تلقائي (إعصار)',
    trip_logout:      '✈️ خروج (إغلاق رحلة)',
    approved:         '🟢 هوية مقبولة',
    rejected:         '🔴 هوية مرفوضة',
    pending:          '⏳ طلب هوية جديد',
};

const SLOT_NAMES = { 1: 'الشخصية الأولى', 2: 'الشخصية الثانية', 3: 'الشخصية الثالثة' };

module.exports = {
    name: 'character-log',
    data: new SlashCommandBuilder()
        .setName('character-log')
        .setDescription('سجل أحداث الشخصيات وطلبات الهويات المعلّقة')
        .addIntegerOption(opt =>
            opt.setName('عدد').setDescription('عدد سجلات الأحداث (افتراضي 15)').setRequired(false).setMinValue(1).setMaxValue(50))
        .addUserOption(opt =>
            opt.setName('مستخدم').setDescription('فلترة بمستخدم معين').setRequired(false)),

    async slashExecute(interaction, db) {
        const limit  = interaction.options.getInteger('عدد') || 15;
        const user   = interaction.options.getUser('مستخدم');

        const [logs, pending] = await Promise.all([
            db.getCharacterLogs(limit, user?.id),
            user ? [] : db.getPendingIdentities(10),
        ]);

        const components = [];

        if (pending.length > 0) {
            const pendingEmbed = new EmbedBuilder()
                .setTitle('⏳ طلبات الهوية المعلّقة')
                .setColor(0xF57F17)
                .setFooter({ text: `${pending.length} طلب بانتظار المراجعة` })
                .setTimestamp();

            for (const p of pending) {
                const time = `<t:${Math.floor(new Date(p.created_at).getTime() / 1000)}:R>`;
                pendingEmbed.addFields({
                    name: `#${p.id} — <@${p.discord_id}> — ${SLOT_NAMES[p.slot] || `شخصية ${p.slot}`}`,
                    value: `👤 ${p.char_name} ${p.family_name} • ⚧ ${p.gender} • 📅 ${p.birth_date} • 📍 ${p.birth_place}\n🕐 ${time}`,
                    inline: false,
                });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`approve_identity_${p.id}`)
                        .setLabel(`✅ قبول #${p.id}`)
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`reject_identity_${p.id}`)
                        .setLabel(`❌ رفض #${p.id}`)
                        .setStyle(ButtonStyle.Danger)
                );
                components.push(row);
            }

            await await interaction.channel.send({ embeds: [pendingEmbed], components });
 await interaction.reply({ content: '​', flags: 64 });
        }

        const logEmbed = new EmbedBuilder()
            .setTitle('📋 سجل الشخصيات')
            .setColor(0x37474F)
            .setFooter({ text: `بوت FANTASY • آخر ${limit} سجل` })
            .setTimestamp();

        if (!logs.length) {
            logEmbed.setDescription('> لا توجد سجلات بعد.');
        } else {
            const lines = logs.map(l => {
                const label    = ACTION_LABELS[l.action] || l.action;
                const time     = `<t:${Math.floor(new Date(l.created_at).getTime() / 1000)}:R>`;
                const charInfo = l.character_name ? ` — **${l.character_name}**` : '';
                const slotStr  = l.slot ? ` (${SLOT_NAMES[l.slot] || `شخصية ${l.slot}`})` : '';
                const who      = l.discord_id === 'system' ? '🤖 النظام' : `<@${l.discord_id}>`;
                return `${label} • ${who}${charInfo}${slotStr} ${time}`;
            });
            logEmbed.setDescription(lines.join('\n'));
        }

        if (pending.length > 0) {
            await interaction.followUp({ embeds: [logEmbed] });
        } else {
            await await interaction.channel.send({ embeds: [logEmbed] });
 await interaction.reply({ content: '​', flags: 64 });
        }
    }
};
