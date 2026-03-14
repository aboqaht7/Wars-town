const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'admin',
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('نظام الإدارة ونقاط الإدارة'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ نظام الإدارة')
            .setColor(0xF9A825)
            .setDescription('لوحة تحكم الإدارة')
            .addFields(
                { name: '🏅 الرتب', value: 'تواصل مع الإدارة لعرض رتبتك', inline: true },
                { name: '⭐ النقاط', value: 'تواصل مع الإدارة لمعرفة نقاطك', inline: true },
            )
            .setImage(await db.getImage('admin') || null)
            .setFooter({ text: 'نظام الإدارة • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('admin_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: '🏅 عرض الرتب', value: 'ranks' },
                    { label: '⭐ نقاط الإدارة', value: 'points' },
                    { label: '👥 إدارة اللاعبين', value: 'manage' },
                    { label: '📋 سجل الإجراءات', value: 'logs' },
                ])
        );
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ نظام الإدارة')
            .setColor(0xF9A825)
            .setDescription('لوحة تحكم الإدارة')
            .addFields(
                { name: '🏅 الرتب', value: 'تواصل مع الإدارة لعرض رتبتك', inline: true },
                { name: '⭐ النقاط', value: 'تواصل مع الإدارة لمعرفة نقاطك', inline: true },
            )
            .setImage(await db.getImage('admin') || null)
            .setFooter({ text: 'نظام الإدارة • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('admin_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: '🏅 عرض الرتب', value: 'ranks' },
                    { label: '⭐ نقاط الإدارة', value: 'points' },
                    { label: '👥 إدارة اللاعبين', value: 'manage' },
                    { label: '📋 سجل الإجراءات', value: 'logs' },
                ])
        );
        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
