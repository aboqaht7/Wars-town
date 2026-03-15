const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);

module.exports = {
    name: 'تعيين-رتبة-ادارة',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-ادارة')
        .setDescription('إدارة رتب الإداريين في السيرفر')
        .addSubcommand(s => s
            .setName('تعيين')
            .setDescription('تعيين أو تغيير رتبة إداري')
            .addUserOption(o => o.setName('العضو').setDescription('العضو').setRequired(true))
            .addStringOption(o => o.setName('الرتبة').setDescription('اختر الرتبة').setRequired(true).setAutocomplete(true))
        )
        .addSubcommand(s => s
            .setName('إزالة')
            .setDescription('إزالة الرتبة من إداري')
            .addUserOption(o => o.setName('العضو').setDescription('العضو').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('نقاط')
            .setDescription('إضافة أو خصم نقاط من إداري')
            .addUserOption(o => o.setName('العضو').setDescription('العضو').setRequired(true))
            .addIntegerOption(o => o.setName('القيمة').setDescription('موجبة للإضافة، سالبة للخصم').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('عرض')
            .setDescription('عرض بطاقة إداري')
            .addUserOption(o => o.setName('العضو').setDescription('العضو').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('قائمة')
            .setDescription('عرض جميع الإداريين مرتبين')
        )
        .addSubcommand(s => s
            .setName('إضافة-رتبة')
            .setDescription('أضف نوع رتبة جديدة')
            .addStringOption(o => o.setName('الاسم').setDescription('اسم الرتبة').setRequired(true))
            .addIntegerOption(o => o.setName('الترتيب').setDescription('رقم الترتيب (كلما قل كان أعلى)').setRequired(false))
        )
        .addSubcommand(s => s
            .setName('حذف-رتبة')
            .setDescription('احذف نوع رتبة')
            .addStringOption(o => o.setName('الاسم').setDescription('اسم الرتبة').setRequired(true).setAutocomplete(true))
        )
        .addSubcommand(s => s
            .setName('الرتب')
            .setDescription('عرض جميع أنواع الرتب المتاحة')
        ),

    async autocomplete(interaction, db) {
        const focused = interaction.options.getFocused().toLowerCase();
        const ranks   = await db.getRankTypes();
        const choices = ranks
            .filter(r => r.name.toLowerCase().includes(focused))
            .slice(0, 25)
            .map(r => ({ name: r.name, value: r.name }));
        return interaction.respond(choices);
    },

    async slashExecute(interaction, db) {
        const sub  = interaction.options.getSubcommand();
        const row2 = new ActionRowBuilder().addComponents(resetButton);

        if (sub === 'إضافة-رتبة') {
            const name     = interaction.options.getString('الاسم');
            const position = interaction.options.getInteger('الترتيب') ?? 99;
            await db.addRankType(name, '', position);

            const embed = new EmbedBuilder()
                .setTitle('✅ تم إضافة الرتبة')
                .setColor(0x5865F2)
                .addFields(
                    { name: 'الاسم',    value: name,          inline: true },
                    { name: 'الترتيب', value: `${position}`,  inline: true },
                )
                .setFooter({ text: 'نظام الرتب الإدارية • بوت FANTASY' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'حذف-رتبة') {
            const name    = interaction.options.getString('الاسم');
            const deleted = await db.deleteRankType(name);
            if (!deleted) return interaction.reply({ content: `❌ الرتبة **${name}** غير موجودة.`, flags: 64 });

            const embed = new EmbedBuilder()
                .setTitle('🗑️ تم حذف الرتبة')
                .setColor(0x888888)
                .setDescription(`تم حذف رتبة **${deleted.name}** من القائمة.`)
                .setFooter({ text: 'نظام الرتب الإدارية • بوت FANTASY' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'الرتب') {
            const ranks = await db.getRankTypes();
            if (!ranks.length) return interaction.reply({ content: '📋 لا توجد رتب مضافة. استخدم `/تعيين-رتبة-ادارة إضافة-رتبة` لإضافة رتبة.', flags: 64 });

            const embed = new EmbedBuilder()
                .setTitle('📋 أنواع الرتب المتاحة')
                .setColor(0x5865F2)
                .setDescription(ranks.map((r, i) => `\`${i + 1}\` **${r.name}**`).join('\n'))
                .addFields({ name: 'العدد الكلي', value: `${ranks.length} رتبة`, inline: true })
                .setFooter({ text: 'نظام الرتب الإدارية • بوت FANTASY' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'تعيين') {
            const target   = interaction.options.getUser('العضو');
            const rankName = interaction.options.getString('الرتبة');
            const prev     = await db.getAdminRank(target.id);

            await db.setAdminRank(target.id, target.username, rankName, interaction.user.id);

            const embed = new EmbedBuilder()
                .setTitle('📋 تعيين رتبة إدارية')
                .setColor(0x5865F2)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: 'العضو',        value: `<@${target.id}>`,          inline: true },
                    { name: 'الرتبة الجديدة', value: `**${rankName}**`,          inline: true },
                    { name: 'تم بواسطة',   value: `<@${interaction.user.id}>`, inline: true },
                )
                .setFooter({ text: 'نظام الرتب الإدارية • بوت FANTASY' })
                .setTimestamp();

            if (prev) embed.addFields({ name: 'الرتبة السابقة', value: prev.rank_name, inline: true });

            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'إزالة') {
            const target  = interaction.options.getUser('العضو');
            const removed = await db.removeAdminRank(target.id);
            if (!removed) return interaction.reply({ content: `❌ **${target.username}** ليس لديه رتبة إدارية مسجلة.`, flags: 64 });

            const embed = new EmbedBuilder()
                .setTitle('🗑️ إزالة رتبة إدارية')
                .setColor(0x888888)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: 'العضو',       value: `<@${target.id}>`,          inline: true },
                    { name: 'الرتبة المُزالة', value: removed.rank_name,       inline: true },
                    { name: 'تم بواسطة',  value: `<@${interaction.user.id}>`, inline: true },
                )
                .setFooter({ text: 'نظام الرتب الإدارية • بوت FANTASY' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'نقاط') {
            const target = interaction.options.getUser('العضو');
            const delta  = interaction.options.getInteger('القيمة');
            const exists = await db.getAdminRank(target.id);
            if (!exists) return interaction.reply({ content: `❌ **${target.username}** ليس لديه رتبة. عيّن له رتبة أولاً.`, flags: 64 });

            const updated = await db.updateAdminPoints(target.id, delta);

            const embed = new EmbedBuilder()
                .setTitle(delta >= 0 ? '⬆️ إضافة نقاط' : '⬇️ خصم نقاط')
                .setColor(delta >= 0 ? 0x00CC66 : 0xFF4444)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: 'العضو',     value: `<@${target.id}>`,            inline: true },
                    { name: 'الرتبة',    value: updated.rank_name,             inline: true },
                    { name: delta >= 0 ? 'نقاط أضيفت' : 'نقاط خُصمت', value: `${Math.abs(delta)} نقطة`, inline: true },
                    { name: 'المجموع الكلي', value: `**${updated.points} نقطة**`, inline: true },
                    { name: 'تم بواسطة',    value: `<@${interaction.user.id}>`,  inline: true },
                )
                .setFooter({ text: 'نظام الرتب الإدارية • بوت FANTASY' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'عرض') {
            const target   = interaction.options.getUser('العضو');
            const rankData = await db.getAdminRank(target.id);
            if (!rankData) return interaction.reply({ content: `❌ **${target.username}** ليس لديه رتبة إدارية مسجلة.`, flags: 64 });

            const date = new Date(rankData.assigned_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

            const embed = new EmbedBuilder()
                .setTitle('بطاقة الإداري')
                .setColor(0x5865F2)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: 'العضو',         value: `<@${target.id}>`,                                              inline: true },
                    { name: 'الرتبة',         value: `**${rankData.rank_name}**`,                                    inline: true },
                    { name: 'النقاط',         value: `**${rankData.points}** نقطة`,                                  inline: true },
                    { name: 'عيّنه',          value: rankData.assigned_by ? `<@${rankData.assigned_by}>` : 'غير معروف', inline: true },
                    { name: 'تاريخ التعيين', value: date,                                                            inline: true },
                )
                .setFooter({ text: 'نظام الرتب الإدارية • بوت FANTASY' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'قائمة') {
            const all = await db.getAllAdminRanks();
            if (!all.length) return interaction.reply({ content: '📋 لا يوجد إداريون مسجلون حالياً.', flags: 64 });

            const ranks = await db.getRankTypes();

            all.sort((a, b) => {
                const ai = ranks.findIndex(r => r.name === a.rank_name);
                const bi = ranks.findIndex(r => r.name === b.rank_name);
                return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
            });

            const lines = all.map(r => `**${r.rank_name}** — <@${r.discord_id}> · ${r.points} نقطة`);

            const embed = new EmbedBuilder()
                .setTitle('📋 قائمة الإداريين')
                .setColor(0x5865F2)
                .setDescription(lines.join('\n'))
                .addFields({ name: 'الإجمالي', value: `${all.length} إداري`, inline: true })
                .setFooter({ text: 'نظام الرتب الإدارية • بوت FANTASY' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '​', flags: 64 });
        }
    },
};
