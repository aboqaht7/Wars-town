const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('Reset Menu').setEmoji('🔄').setStyle(ButtonStyle.Secondary);
const resetRow = new ActionRowBuilder().addComponents(resetButton);

module.exports = {
    name: 'إدارة-قضاة',
    data: new SlashCommandBuilder()
        .setName('إدارة-قضاة')
        .setDescription('Manage the certified judges list')
        .addSubcommand(s => s
            .setName('إضافة')
            .setDescription('Add a judge to the list and grant them their role automatically')
            .addUserOption(o => o.setName('العضو').setDescription('The member to target').setRequired(true))
            .addStringOption(o => o.setName('الاسم').setDescription('Judge display name').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('حذف')
            .setDescription('Remove a judge from the list and revoke their role')
            .addUserOption(o => o.setName('العضو').setDescription('The member to target').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('قائمة')
            .setDescription('View all certified judges')
        ),

    async slashExecute(interaction, db) {
        const { isAdmin } = require('../utils');
        if (!(await isAdmin(interaction.member, db)))
            return interaction.reply({ content: '❌ Admins only.', flags: 64 });

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
                        roleStatus = `\n✅ Role <@&${judgeRoleId}> granted automatically`;
                    }
                } catch (e) {
                    roleStatus = '\n⚠️ Could not grant role (check bot permissions)';
                }
            } else {
                roleStatus = '\n⚠️ Judge role not set — use `/تعيين-Rank-قاضي`';
            }

            const _img = await db.getImage('عدل').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Judge Added')
                .setColor(0x4A148C)
                .setDescription(roleStatus || null)
                .addFields(
                    { name: '👤 Member', value: `<@${user.id}>`, inline: true },
                    { name: '📛 Name',   value: name,             inline: true },
                )
                .setFooter({ text: 'Justice System • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [resetRow] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'حذف') {
            const user    = interaction.options.getUser('العضو');
            const deleted = await db.removeJudge(user.id);
            if (!deleted) return interaction.reply({ content: '❌ This member is not registered as a judge.', flags: 64 });

            let roleStatus = '';
            const judgeRoleId = await db.getConfig('judge_role_id');
            if (judgeRoleId) {
                try {
                    const member = interaction.guild.members.cache.get(user.id)
                        || await interaction.guild.members.fetch(user.id);
                    if (member) {
                        await member.roles.remove(judgeRoleId);
                        roleStatus = `\n✅ Role <@&${judgeRoleId}> removed automatically`;
                    }
                } catch (e) {
                    roleStatus = '\n⚠️ Could not remove role (check bot permissions)';
                }
            }

            const _img = await db.getImage('عدل').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Judge Removed')
                .setColor(0xB71C1C)
                .setDescription(roleStatus || null)
                .addFields({ name: '👤 Member', value: `<@${user.id}>`, inline: true })
                .setFooter({ text: 'Justice System • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [resetRow] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'قائمة') {
            const judges = await db.getJudges();
            if (!judges.length) return interaction.reply({ content: '📋 No judges registered currently.', flags: 64 });
            const lines = judges.map((j, i) => `**${i + 1}.** ${j.judge_name} — <@${j.discord_id}>`).join('\n');
            const _img = await db.getImage('عدل').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Certified Judges')
                .setColor(0x4A148C)
                .setDescription(lines)
                .addFields({ name: 'Total', value: `${judges.length} judge(s)`, inline: true })
                .setFooter({ text: 'Justice System • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [resetRow] });
            return interaction.reply({ content: '​', flags: 64 });
        }
    },
};
