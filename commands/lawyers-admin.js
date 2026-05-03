const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('Reset Menu').setEmoji({ id: '1479212270746599528', name: 'GL137', animated: true }).setStyle(ButtonStyle.Secondary);
const row2 = new ActionRowBuilder().addComponents(resetButton);
const { buildMain } = require('./lawyer-tasks');

module.exports = {
    name: 'إدارة-محامين',
    data: new SlashCommandBuilder()
        .setName('إدارة-محامين')
        .setDescription('Manage the certified lawyers list')
        .addSubcommand(s => s
            .setName('إضافة')
            .setDescription('Add a lawyer to the list')
            .addUserOption(o => o.setName('العضو').setDescription('The member to target').setRequired(true))
            .addStringOption(o => o.setName('الاسم').setDescription('Lawyer display name').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('حذف')
            .setDescription('Remove a lawyer from the list')
            .addUserOption(o => o.setName('العضو').setDescription('The member to target').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('قائمة')
            .setDescription('View all certified lawyers')
        )
        .addSubcommand(s => s
            .setName('تعيين-روم')
            .setDescription('Set the channel for lawyer tasks')
            .addChannelOption(o => o.setName('الروم').setDescription('The channel for lawyer tasks').setRequired(true))
        ),

    async slashExecute(interaction, db) {
        const { isAdmin } = require('../utils');
        if (!(await isAdmin(interaction.member, db)))
            return interaction.reply({ content: '❌ Admins only.', flags: 64 });

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
                        roleStatus = `\n✅ Role <@&${lawyerRoleId}> granted automatically`;
                    }
                } catch (e) {
                    roleStatus = '\n⚠️ Could not grant role (check bot permissions)';
                }
            } else {
                roleStatus = '\n⚠️ Lawyer role not set — use `/تعيين-Rank-محامي`';
            }

            const _img = await db.getImage('محاماة').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Lawyer Added')
                .setColor(0xE53935)
                .setDescription(roleStatus || null)
                .addFields(
                    { name: '👤 Member', value: `<@${user.id}>`, inline: true },
                    { name: '📛 Name',   value: name,             inline: true },
                )
                .setFooter({ text: 'Law System • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            const tasksChannelId = await db.getConfig('lawyer_tasks_channel');
            const tasksTarget = (tasksChannelId && interaction.guild.channels.cache.get(tasksChannelId)) || interaction.channel;
            await tasksTarget.send(await buildMain(db));
            return interaction.reply({ content: '\u200b', flags: 64 });
        }

        if (sub === 'حذف') {
            const user    = interaction.options.getUser('العضو');
            const deleted = await db.removeLawyer(user.id);
            if (!deleted) return interaction.reply({ content: '❌ This member is not registered as a lawyer.', flags: 64 });

            let roleStatus = '';
            const lawyerRoleId = await db.getConfig('lawyer_role_id');
            if (lawyerRoleId) {
                try {
                    const member = interaction.guild.members.cache.get(user.id)
                        || await interaction.guild.members.fetch(user.id);
                    if (member) {
                        await member.roles.remove(lawyerRoleId);
                        roleStatus = `\n✅ Role <@&${lawyerRoleId}> removed automatically`;
                    }
                } catch (e) {
                    roleStatus = '\n⚠️ Could not remove role (check bot permissions)';
                }
            }

            const _img = await db.getImage('محاماة').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Lawyer Removed')
                .setColor(0xE53935)
                .setDescription(roleStatus || null)
                .addFields({ name: '👤 Member', value: `<@${user.id}>`, inline: true })
                .setFooter({ text: 'Law System • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'قائمة') {
            const lawyers = await db.getLawyers();
            if (!lawyers.length) return interaction.reply({ content: '📋 No lawyers registered currently.', flags: 64 });
            const lines = lawyers.map((l, i) => `**${i + 1}.** ${l.lawyer_name} — <@${l.discord_id}>`).join('\n');
            const _img = await db.getImage('محاماة').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Certified Lawyers')
                .setColor(0xE53935)
                .setDescription(lines)
                .addFields({ name: 'Total', value: `${lawyers.length} lawyer(s)`, inline: true })
                .setFooter({ text: 'Law System • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '\u200b', flags: 64 });
        }

        if (sub === 'تعيين-روم') {
            const channel = interaction.options.getChannel('الروم');
            await db.setConfig('lawyer_tasks_channel', channel.id);
            const _img = await db.getImage('محاماة').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Lawyer Tasks Channel Set')
                .setColor(0xE53935)
                .setDescription(`Lawyer tasks will be sent to <#${channel.id}> automatically`)
                .setFooter({ text: 'Law System • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [row2] });
            return interaction.reply({ content: '\u200b', flags: 64 });
        }
    },
};
