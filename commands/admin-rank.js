const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

const RANKS = [
    'مدير عام',
    'مدير',
    'مشرف',
    'مشرف مساعد',
    'عضو إداري',
];

const RANK_COLORS = {
    'مدير عام':     0xFF0000,
    'مدير':         0xFF6600,
    'مشرف':         0xFFCC00,
    'مشرف مساعد':  0x00CCFF,
    'عضو إداري':   0x99AAFF,
};

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);

function rankEmoji(rank) {
    const map = {
        'مدير عام': '👑',
        'مدير': '🔴',
        'مشرف': '🟠',
        'مشرف مساعد': '🔵',
        'عضو إداري': '🟣',
    };
    return map[rank] || '⭐';
}

module.exports = {
    name: 'تعيين-رتبة-ادارة',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-ادارة')
        .setDescription('إدارة رتب الإداريين في السيرفر')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(s => s
            .setName('تعيين')
            .setDescription('تعيين أو تغيير رتبة إداري')
            .addUserOption(o => o.setName('العضو').setDescription('العضو المراد تعيينه').setRequired(true))
            .addStringOption(o => o
                .setName('الرتبة')
                .setDescription('الرتبة الإدارية')
                .setRequired(true)
                .addChoices(
                    { name: '👑 مدير عام',      value: 'مدير عام' },
                    { name: '🔴 مدير',           value: 'مدير' },
                    { name: '🟠 مشرف',           value: 'مشرف' },
                    { name: '🔵 مشرف مساعد',    value: 'مشرف مساعد' },
                    { name: '🟣 عضو إداري',      value: 'عضو إداري' },
                )
            )
        )
        .addSubcommand(s => s
            .setName('إزالة')
            .setDescription('إزالة الرتبة الإدارية من عضو')
            .addUserOption(o => o.setName('العضو').setDescription('العضو المراد إزالة رتبته').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('نقاط')
            .setDescription('إضافة أو خصم نقاط من إداري')
            .addUserOption(o => o.setName('العضو').setDescription('العضو').setRequired(true))
            .addIntegerOption(o => o.setName('القيمة').setDescription('نقاط موجبة للإضافة، سالبة للخصم').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('عرض')
            .setDescription('عرض رتبة عضو معين')
            .addUserOption(o => o.setName('العضو').setDescription('العضو').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('قائمة')
            .setDescription('عرض جميع الإداريين وترتيبهم')
        ),

    async slashExecute(interaction, db) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'تعيين') {
            const target   = interaction.options.getUser('العضو');
            const rankName = interaction.options.getString('الرتبة');
            const prev     = await db.getAdminRank(target.id);

            await db.setAdminRank(target.id, target.username, rankName, interaction.user.id);

            const embed = new EmbedBuilder()
                .setTitle('📋 تعيين رتبة إدارية')
                .setColor(RANK_COLORS[rankName] || 0x5865F2)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: '👤 العضو',     value: `<@${target.id}>`, inline: true },
                    { name: `${rankEmoji(rankName)} الرتبة الجديدة`, value: `**${rankName}**`, inline: true },
                    { name: '🔧 تم بواسطة', value: `<@${interaction.user.id}>`, inline: true },
                )
                .setFooter({ text: 'نظام الرتب الإدارية • بوت FANTASY' })
                .setTimestamp();

            if (prev) {
                embed.addFields({ name: '📌 الرتبة السابقة', value: `${rankEmoji(prev.rank_name)} ${prev.rank_name}`, inline: true });
            }

            const row = new ActionRowBuilder().addComponents(resetButton);
            return interaction.reply({ embeds: [embed], components: [row] });
        }

        if (sub === 'إزالة') {
            const target = interaction.options.getUser('العضو');
            const removed = await db.removeAdminRank(target.id);

            if (!removed) {
                return interaction.reply({ content: `❌ **${target.username}** ليس لديه رتبة إدارية مسجلة.`, flags: 64 });
            }

            const embed = new EmbedBuilder()
                .setTitle('🗑️ إزالة رتبة إدارية')
                .setColor(0x888888)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: '👤 العضو',       value: `<@${target.id}>`, inline: true },
                    { name: '❌ الرتبة المُزالة', value: `${rankEmoji(removed.rank_name)} ${removed.rank_name}`, inline: true },
                    { name: '🔧 تم بواسطة',   value: `<@${interaction.user.id}>`, inline: true },
                )
                .setFooter({ text: 'نظام الرتب الإدارية • بوت FANTASY' })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(resetButton);
            return interaction.reply({ embeds: [embed], components: [row] });
        }

        if (sub === 'نقاط') {
            const target = interaction.options.getUser('العضو');
            const delta  = interaction.options.getInteger('القيمة');
            const row2   = new ActionRowBuilder().addComponents(resetButton);

            const rankData = await db.getAdminRank(target.id);
            if (!rankData) return interaction.reply({ content: `❌ **${target.username}** ليس لديه رتبة إدارية. عيّن له رتبة أولاً بـ \`/تعيين-رتبة-ادارة تعيين\`.`, flags: 64 });

            const updated = await db.updateAdminPoints(target.id, delta);

            const embed = new EmbedBuilder()
                .setTitle(delta >= 0 ? '⬆️ إضافة نقاط إدارية' : '⬇️ خصم نقاط إدارية')
                .setColor(delta >= 0 ? 0x00CC66 : 0xFF4444)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: '👤 العضو',     value: `<@${target.id}>`, inline: true },
                    { name: `${rankEmoji(updated.rank_name)} الرتبة`, value: updated.rank_name, inline: true },
                    { name: delta >= 0 ? '➕ نقاط أضيفت' : '➖ نقاط خُصمت', value: `${Math.abs(delta)} نقطة`, inline: true },
                    { name: '📊 المجموع الكلي', value: `**${updated.points} نقطة**`, inline: true },
                    { name: '🔧 تم بواسطة', value: `<@${interaction.user.id}>`, inline: true },
                )
                .setFooter({ text: 'نظام الرتب الإدارية • بوت FANTASY' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], components: [row2] });
        }

        if (sub === 'عرض') {
            const target   = interaction.options.getUser('العضو');
            const rankData = await db.getAdminRank(target.id);
            const row2     = new ActionRowBuilder().addComponents(resetButton);

            if (!rankData) {
                return interaction.reply({ content: `❌ **${target.username}** ليس لديه رتبة إدارية مسجلة.`, flags: 64 });
            }

            const assignedDate = new Date(rankData.assigned_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

            const embed = new EmbedBuilder()
                .setTitle(`${rankEmoji(rankData.rank_name)} بطاقة الإداري`)
                .setColor(RANK_COLORS[rankData.rank_name] || 0x5865F2)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: '👤 العضو',          value: `<@${target.id}>`, inline: true },
                    { name: '🏷️ الرتبة',          value: `**${rankData.rank_name}**`, inline: true },
                    { name: '📊 النقاط',          value: `**${rankData.points}** نقطة`, inline: true },
                    { name: '🔧 عيّنه',           value: rankData.assigned_by ? `<@${rankData.assigned_by}>` : 'غير معروف', inline: true },
                    { name: '📅 تاريخ التعيين',  value: assignedDate, inline: true },
                )
                .setFooter({ text: 'نظام الرتب الإدارية • بوت FANTASY' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], components: [row2] });
        }

        if (sub === 'قائمة') {
            const all  = await db.getAllAdminRanks();
            const row2 = new ActionRowBuilder().addComponents(resetButton);

            if (!all.length) {
                return interaction.reply({ content: '📋 لا يوجد إداريون مسجلون حالياً.', flags: 64 });
            }

            const RANK_ORDER = ['مدير عام', 'مدير', 'مشرف', 'مشرف مساعد', 'عضو إداري'];
            all.sort((a, b) => {
                const ai = RANK_ORDER.indexOf(a.rank_name);
                const bi = RANK_ORDER.indexOf(b.rank_name);
                return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
            });

            const lines = all.map(r =>
                `${rankEmoji(r.rank_name)} **${r.rank_name}** — <@${r.discord_id}> · ${r.points} نقطة`
            );

            const embed = new EmbedBuilder()
                .setTitle('📋 قائمة الإداريين')
                .setColor(0x5865F2)
                .setDescription(lines.join('\n'))
                .addFields({ name: '👥 إجمالي الإداريين', value: `${all.length} إداري`, inline: true })
                .setFooter({ text: 'نظام الرتب الإدارية • بوت FANTASY' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], components: [row2] });
        }
    },
};
