const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
const row2 = new ActionRowBuilder().addComponents(resetButton);
const { buildMain } = require('./lawyer-tasks');

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
        )
        .addSubcommand(s => s
            .setName('تعيين-روم')
            .setDescription('تحديد الروم الذي تُرسل فيه مهام المحامين')
            .addChannelOption(o => o.setName('الروم').setDescription('الروم المخصص لمهام المحامين').setRequired(true))
        ),

    async slashExecute(interaction, db) {
        const { isAdmin } = require('../utils');
        if (!(await isAdmin(interaction.member, db)))
            return interaction.reply({ content: '❌ للإدارة فقط.', flags: 64 });

        const sub = interaction.options.getSubcommand();

        if (sub === 'إضافة') {
            const user = interaction.options.getUser('العضو');
            const name = interaction.options.getString('الاسم');
            await db.addLawyer(user.id, name);

            let roleStatus = '';
            const lawyerRoleId = await db.getConfig('lawyer_role_id');
            if (lawyerRoleId) {
                try {
                    const member = interaction.guild.members.cache.get(user.id)
                        || await interaction.guild.members.fetch(user.id);
                    if (member) {
                        await member.roles.add(lawyerRoleId);
                        roleStatus = `\n✅ تم منح رتبة <@&${lawyerRoleId}> تلقائياً`;
                    }
                } catch (e) {
                    roleStatus = '\n⚠️ لم أتمكن من منح الرتبة (تحقق من صلاحيات البوت)';
                }
            } else {
                roleStatus = '\n⚠️ لم يتم تحديد رتبة المحامين — استخدم `/تعيين-رتبة-محامي`';
            }

            const embed = new EmbedBuilder()
                .setTitle('✅ تمت إضافة المحامي')
                .setColor(0x1B5E20)
                .setDescription(roleStatus || null)
                .addFields(
                    { name: '👤 العضو',    value: `<@${user.id}>`, inline: true },
                    { name: '📛 الاسم',    value: name,             inline: true },
                )
                .setFooter({ text: 'نظام المحاماة • بوت FANTASY' }).setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            // أرسل مهام المحامي الجديد للروم المحدد تلقائياً
            const tasksChannelId = await db.getConfig('lawyer_tasks_channel');
            const tasksTarget = (tasksChannelId && interaction.guild.channels.cache.get(tasksChannelId)) || interaction.channel;
            await tasksTarget.send(await buildMain(db));
            return interaction.reply({ content: '\u200b', flags: 64 });
        }

        if (sub === 'حذف') {
            const user    = interaction.options.getUser('العضو');
            const deleted = await db.removeLawyer(user.id);
            if (!deleted) return interaction.reply({ content: '❌ هذا العضو غير مسجل كمحامٍ.', flags: 64 });

            let roleStatus = '';
            const lawyerRoleId = await db.getConfig('lawyer_role_id');
            if (lawyerRoleId) {
                try {
                    const member = interaction.guild.members.cache.get(user.id)
                        || await interaction.guild.members.fetch(user.id);
                    if (member) {
                        await member.roles.remove(lawyerRoleId);
                        roleStatus = `\n✅ تمت إزالة رتبة <@&${lawyerRoleId}> تلقائياً`;
                    }
                } catch (e) {
                    roleStatus = '\n⚠️ لم أتمكن من إزالة الرتبة (تحقق من صلاحيات البوت)';
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('🗑️ تمت إزالة المحامي')
                .setColor(0xB71C1C)
                .setDescription(roleStatus || null)
                .addFields({ name: '👤 العضو', value: `<@${user.id}>`, inline: true })
                .setFooter({ text: 'نظام المحاماة • بوت FANTASY' }).setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '​', flags: 64 });
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
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '\u200b', flags: 64 });
        }

        if (sub === 'تعيين-روم') {
            const channel = interaction.options.getChannel('الروم');
            await db.setConfig('lawyer_tasks_channel', channel.id);
            const embed = new EmbedBuilder()
                .setTitle('✅ تم تعيين روم مهام المحامين')
                .setColor(0x0D47A1)
                .setDescription(`سيتم إرسال مهام المحامين في <#${channel.id}> تلقائياً`)
                .setFooter({ text: 'نظام المحاماة • بوت FANTASY' }).setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '\u200b', flags: 64 });
        }
    },
};
