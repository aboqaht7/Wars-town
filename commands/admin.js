const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'admin',
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('نظام الإدارة ونقاط الإدارة'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('الإدارة')
            .setDescription('اختر العملية الإدارية')
            .setColor('Red')
            .setImage(await db.getImage('admin') || null);
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('admin_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: 'عرض الرتب', value: 'ranks' },
                    { label: 'نقاط الإدارة', value: 'points' },
                    { label: 'إدارة اللاعبين', value: 'manage' },
                    { label: 'سجل الإجراءات', value: 'logs' },
                ])
        );
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('الإدارة')
            .setDescription('اختر العملية الإدارية')
            .setColor('Red')
            .setImage(await db.getImage('admin') || null);
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('admin_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: 'عرض الرتب', value: 'ranks' },
                    { label: 'نقاط الإدارة', value: 'points' },
                    { label: 'إدارة اللاعبين', value: 'manage' },
                    { label: 'سجل الإجراءات', value: 'logs' },
                ])
        );
        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
