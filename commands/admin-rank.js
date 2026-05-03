const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('Reset Menu').setEmoji({ id: '1479212270746599528', name: 'GL137', animated: true }).setStyle(ButtonStyle.Secondary);

module.exports = {
    name: 'تعيين-رتبة-ادارة',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-ادارة')
        .setDescription('Manage admin ranks in the server')
        .addSubcommand(s => s
            .setName('تعيين')
            .setDescription('Set or change an admin rank')
            .addUserOption(o => o.setName('العضو').setDescription('The member to target').setRequired(true))
            .addStringOption(o => o.setName('الرتبة').setDescription('Choose the rank').setRequired(true).setAutocomplete(true))
        )
        .addSubcommand(s => s
            .setName('إزالة')
            .setDescription('Remove rank from an admin')
            .addUserOption(o => o.setName('العضو').setDescription('The member to target').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('نقاط')
            .setDescription('Add or deduct points from an admin')
            .addUserOption(o => o.setName('العضو').setDescription('The member to target').setRequired(true))
            .addIntegerOption(o => o.setName('القيمة').setDescription('Positive to add, negative to deduct').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('عرض')
            .setDescription('View admin card')
            .addUserOption(o => o.setName('العضو').setDescription('The member to target').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('قائمة')
            .setDescription('View all admins ranked')
        )
        .addSubcommand(s => s
            .setName('إضافة-رتبة')
            .setDescription('Add a new rank type')
            .addStringOption(o => o.setName('الاسم').setDescription('Rank name').setRequired(true))
            .addIntegerOption(o => o.setName('الترتيب').setDescription('Sort number (lower = higher rank)').setRequired(false))
        )
        .addSubcommand(s => s
            .setName('حذف-رتبة')
            .setDescription('Delete a rank type')
            .addStringOption(o => o.setName('الاسم').setDescription('Rank name').setRequired(true).setAutocomplete(true))
        )
        .addSubcommand(s => s
            .setName('الرتب')
            .setDescription('View all available rank types')
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
                .setTitle('Rank Added')
                .setColor(0xE53935)
                .addFields(
                    { name: 'Name',  value: name,          inline: true },
                    { name: 'Order', value: `${position}`,  inline: true },
                )
                .setFooter({ text: 'Admin Ranks System • FANTASY Bot' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'حذف-رتبة') {
            const name    = interaction.options.getString('الاسم');
            const deleted = await db.deleteRankType(name);
            if (!deleted) return interaction.reply({ content: `❌ Rank **${name}** not found.`, flags: 64 });

            const embed = new EmbedBuilder()
                .setTitle('Rank Deleted')
                .setColor(0xE53935)
                .setDescription(`Rank **${deleted.name}** has been deleted.`)
                .setFooter({ text: 'Admin Ranks System • FANTASY Bot' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'الرتب') {
            const ranks = await db.getRankTypes();
            if (!ranks.length) return interaction.reply({ content: '📋 No ranks added yet. Use `/تعيين-رتبة-ادارة إضافة-رتبة` to add one.', flags: 64 });

            const embed = new EmbedBuilder()
                .setTitle('Available Rank Types')
                .setColor(0xE53935)
                .setDescription(ranks.map((r, i) => `\`${i + 1}\` **${r.name}**`).join('\n'))
                .addFields({ name: 'Total', value: `${ranks.length} rank(s)`, inline: true })
                .setFooter({ text: 'Admin Ranks System • FANTASY Bot' })
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
                .setTitle('Assign Admin Rank')
                .setColor(0xE53935)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: 'Member',       value: `<@${target.id}>`,          inline: true },
                    { name: 'New Rank',     value: `**${rankName}**`,           inline: true },
                    { name: 'Assigned by',  value: `<@${interaction.user.id}>`, inline: true },
                )
                .setFooter({ text: 'Admin Ranks System • FANTASY Bot' })
                .setTimestamp();

            if (prev) embed.addFields({ name: 'Previous Rank', value: prev.rank_name, inline: true });

            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'إزالة') {
            const target  = interaction.options.getUser('العضو');
            const removed = await db.removeAdminRank(target.id);
            if (!removed) return interaction.reply({ content: `❌ **${target.username}** has no registered admin rank.`, flags: 64 });

            const embed = new EmbedBuilder()
                .setTitle('Remove Admin Rank')
                .setColor(0xE53935)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: 'Member',      value: `<@${target.id}>`,          inline: true },
                    { name: 'Rank Removed', value: removed.rank_name,         inline: true },
                    { name: 'By',          value: `<@${interaction.user.id}>`, inline: true },
                )
                .setFooter({ text: 'Admin Ranks System • FANTASY Bot' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'نقاط') {
            const target = interaction.options.getUser('العضو');
            const delta  = interaction.options.getInteger('القيمة');
            const exists = await db.getAdminRank(target.id);
            if (!exists) return interaction.reply({ content: `❌ **${target.username}** has no rank. Assign a rank first.`, flags: 64 });

            const updated = await db.updateAdminPoints(target.id, delta);

            const embed = new EmbedBuilder()
                .setTitle(delta >= 0 ? '⬆️ Points Added' : '⬇️ Points Deducted')
                .setColor(delta >= 0 ? 0x00CC66 : 0xFF4444)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: 'Member',       value: `<@${target.id}>`,            inline: true },
                    { name: 'Rank',         value: updated.rank_name,             inline: true },
                    { name: delta >= 0 ? 'Points Added' : 'Points Deducted',
                                            value: `${Math.abs(delta)} pt(s)`,    inline: true },
                    { name: 'Total Points', value: `**${updated.points} pt(s)**`, inline: true },
                    { name: 'By',           value: `<@${interaction.user.id}>`,   inline: true },
                )
                .setFooter({ text: 'Admin Ranks System • FANTASY Bot' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'عرض') {
            const target   = interaction.options.getUser('العضو');
            const rankData = await db.getAdminRank(target.id);
            if (!rankData) return interaction.reply({ content: `❌ **${target.username}** has no registered admin rank.`, flags: 64 });

            const date = new Date(rankData.assigned_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

            const embed = new EmbedBuilder()
                .setTitle('Admin Card')
                .setColor(0xE53935)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: 'Member',        value: `<@${target.id}>`,                                                  inline: true },
                    { name: 'Rank',          value: `**${rankData.rank_name}**`,                                        inline: true },
                    { name: 'Points',        value: `**${rankData.points}** pt(s)`,                                     inline: true },
                    { name: 'Assigned by',   value: rankData.assigned_by ? `<@${rankData.assigned_by}>` : 'Unknown',    inline: true },
                    { name: 'Assigned on',   value: date,                                                               inline: true },
                )
                .setFooter({ text: 'Admin Ranks System • FANTASY Bot' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'قائمة') {
            const all = await db.getAllAdminRanks();
            if (!all.length) return interaction.reply({ content: '📋 No admins registered currently.', flags: 64 });

            const ranks = await db.getRankTypes();

            all.sort((a, b) => {
                const ai = ranks.findIndex(r => r.name === a.rank_name);
                const bi = ranks.findIndex(r => r.name === b.rank_name);
                return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
            });

            const lines = all.map(r => `**${r.rank_name}** — <@${r.discord_id}> · ${r.points} pt(s)`);

            const embed = new EmbedBuilder()
                .setTitle('Admin List')
                .setColor(0xE53935)
                .setDescription(lines.join('\n'))
                .addFields({ name: 'Total', value: `${all.length} admin(s)`, inline: true })
                .setFooter({ text: 'Admin Ranks System • FANTASY Bot' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '​', flags: 64 });
        }
    },
};
