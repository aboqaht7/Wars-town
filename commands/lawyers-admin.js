const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
const row2 = new ActionRowBuilder().addComponents(resetButton);

module.exports = {
    name: 'إدارة-محامين',
    data: new SlashCommandBuilder()
        .setName('إدارة-محامين')
        .setDescription('إدارة قائمة المحامين المعتمدين')
        .addSubcommand(s => s
            .setName('إضافة')
            .setDescription('إضافة محامٍ للقائمة')
            .addUserOption(o => o.setName('العضو').setDescription('العضو').setRequired(true))
            .addStringOption(o => o.setName('الاسم').setDescription('اسم المحامي كما سيظهر').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('حذف')
            .setDescription('حذف محامٍ من القائمة')
            .addUserOption(o => o.setName('العضو').setDescription('العضو').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('قائمة')
            .setDescription('عرض جميع المحامين المعتمدين')
        ),

    async slashExecute(interaction, db) {
        if (!interaction.member.permissions.has('Administrator'))
            return interaction.reply({ content: '❌ للإدارة فقط.', flags: 64 });

        const sub = interaction.options.getSubcommand();

        if (sub === 'إضافة') {
            const user = interaction.options.getUser('العضو');
            const name = interaction.options.getString('الاسم');
            await db.addLawyer(user.id, name);
            const embed = new EmbedBuilder()
                .setTitle('✅ تمت إضافة المحامي')
                .setColor(0x1B5E20)
                .addFields(
                    { name: '👤 العضو',    value: `<@${user.id}>`, inline: true },
                    { name: '📛 الاسم',    value: name,             inline: true },
                )
                .setFooter({ text: 'نظام المحاماة • بوت FANTASY' }).setTimestamp();
            return interaction.reply({ embeds: [embed], components: [row2], flags: 64 });
        }

        if (sub === 'حذف') {
            const user    = interaction.options.getUser('العضو');
            const deleted = await db.removeLawyer(user.id);
            if (!deleted) return interaction.reply({ content: '❌ هذا العضو غير مسجل كمحامٍ.', flags: 64 });
            const embed = new EmbedBuilder()
                .setTitle('🗑️ تمت إزالة المحامي')
                .setColor(0xB71C1C)
                .addFields({ name: '👤 العضو', value: `<@${user.id}>`, inline: true })
                .setFooter({ text: 'نظام المحاماة • بوت FANTASY' }).setTimestamp();
            return interaction.reply({ embeds: [embed], components: [row2], flags: 64 });
        }

        if (sub === 'قائمة') {
            const lawyers = await db.getLawyers();
            if (!lawyers.length) return interaction.reply({ content: '📋 لا يوجد محامون مسجلون حالياً.', flags: 64 });
            const lines = lawyers.map((l, i) => `**${i + 1}.** ${l.lawyer_name} — <@${l.discord_id}>`).join('\n');
            const embed = new EmbedBuilder()
                .setTitle('👨‍⚖️ المحامون المعتمدون')
                .setColor(0x0D47A1)
                .setDescription(lines)
                .addFields({ name: 'الإجمالي', value: `${lawyers.length} محامٍ`, inline: true })
                .setFooter({ text: 'نظام المحاماة • بوت FANTASY' }).setTimestamp();
            return interaction.reply({ embeds: [embed], components: [row2], flags: 64 });
        }
    },
};
