const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('Reset Menu').setEmoji('🔄').setStyle(ButtonStyle.Secondary);
const resetRow = new ActionRowBuilder().addComponents(resetButton);

module.exports = {
    name: 'إدارة-قضاة',
    data: new SlashCommandBuilder()
        .setName('إدارة-قضاة')
        .setDescription('إدارة قائمة القضاة المعتمدين')
        .addSubcommand(s => s
            .setName('إضافة')
            .setDescription('إضافة قاضٍ للقائمة ومنحه الرتبة تلقائياً')
            .addUserOption(o => o.setName('العضو').setDescription('العضو').setRequired(true))
            .addStringOption(o => o.setName('الاسم').setDescription('اسم القاضي كما سيظهر').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('حذف')
            .setDescription('حذف قاضٍ من القائمة وإزالة رتبته')
            .addUserOption(o => o.setName('العضو').setDescription('العضو').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('قائمة')
            .setDescription('عرض جميع القضاة المعتمدين')
        ),

    async slashExecute(interaction, db) {
        const { isAdmin } = require('../utils');
        if (!(await isAdmin(interaction.member, db)))
            return interaction.reply({ content: '❌ للإدارة فقط.', flags: 64 });

        const sub = interaction.options.getSubcommand();

        if (sub === 'إضافة') {
            const user = interaction.options.getUser('العضو');
            const name = interaction.options.getString('الاسم');

            await db.addJudge(user.id, name);

            let roleStatus = '';
            const judgeRoleId = await db.getConfig('judge_role_id');
            if (judgeRoleId) {
                try {
                    const member = interaction.guild.members.cache.get(user.id)
                        || await interaction.guild.members.fetch(user.id);
                    if (member) {
                        await member.roles.add(judgeRoleId);
                        roleStatus = `\n✅ تم منح رتبة <@&${judgeRoleId}> تلقائياً`;
                    }
                } catch (e) {
                    roleStatus = '\n⚠️ لم أتمكن من منح الرتبة (تحقق من صلاحيات البوت)';
                }
            } else {
                roleStatus = '\n⚠️ لم يتم تحديد رتبة القضاة — استخدم `/تعيين-رتبة-قاضي`';
            }

            const _img = await db.getImage('عدل').catch(() => null);


            const embed = new EmbedBuilder()
                .setTitle('Judge Added')
                .setColor(0x4A148C)
                .setDescription(roleStatus || null)
                .addFields(
                    { name: '👤 العضو',  value: `<@${user.id}>`, inline: true },
                    { name: '📛 الاسم', value: name,              inline: true },
                )
                .setFooter({ text: 'نظام العدل • بوت FANTASY' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [resetRow] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'حذف') {
            const user    = interaction.options.getUser('العضو');
            const deleted = await db.removeJudge(user.id);
            if (!deleted) return interaction.reply({ content: '❌ هذا العضو غير مسجل كقاضٍ.', flags: 64 });

            let roleStatus = '';
            const judgeRoleId = await db.getConfig('judge_role_id');
            if (judgeRoleId) {
                try {
                    const member = interaction.guild.members.cache.get(user.id)
                        || await interaction.guild.members.fetch(user.id);
                    if (member) {
                        await member.roles.remove(judgeRoleId);
                        roleStatus = `\n✅ تمت إزالة رتبة <@&${judgeRoleId}> تلقائياً`;
                    }
                } catch (e) {
                    roleStatus = '\n⚠️ لم أتمكن من إزالة الرتبة (تحقق من صلاحيات البوت)';
                }
            }

            const _img = await db.getImage('عدل').catch(() => null);


            const embed = new EmbedBuilder()
                .setTitle('Judge Removed')
                .setColor(0xB71C1C)
                .setDescription(roleStatus || null)
                .addFields({ name: '👤 العضو', value: `<@${user.id}>`, inline: true })
                .setFooter({ text: 'نظام العدل • بوت FANTASY' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [resetRow] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'قائمة') {
            const judges = await db.getJudges();
            if (!judges.length) return interaction.reply({ content: '📋 لا يوجد قضاة مسجلون حالياً.', flags: 64 });
            const lines = judges.map((j, i) => `**${i + 1}.** ${j.judge_name} — <@${j.discord_id}>`).join('\n');
            const _img = await db.getImage('عدل').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Certified Judges')
                .setColor(0x4A148C)
                .setDescription(lines)
                .addFields({ name: 'الإجمالي', value: `${judges.length} قاضٍ`, inline: true })
                .setFooter({ text: 'نظام العدل • بوت FANTASY' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [resetRow] });
            return interaction.reply({ content: '​', flags: 64 });
        }
    },
};
