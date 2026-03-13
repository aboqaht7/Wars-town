const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'jobs',
    data: new SlashCommandBuilder()
        .setName('jobs')
        .setDescription('عرض الوظائف الحرة'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('الوظائف الحرة')
            .setDescription('اختر وظيفتك الحرة')
            .setColor('Red')
            .setImage(await db.getImage('jobs') || null);
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('jobs_menu')
                .setPlaceholder('اختر وظيفة')
                .addOptions([
                    { label: 'صيد السمك', value: 'fishing' },
                    { label: 'تكسي', value: 'taxi' },
                    { label: 'صيد الحيوانات', value: 'hunting' },
                    { label: 'منجم', value: 'mining' },
                ])
        );
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('الوظائف الحرة')
            .setDescription('اختر وظيفتك الحرة')
            .setColor('Red')
            .setImage(await db.getImage('jobs') || null);
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('jobs_menu')
                .setPlaceholder('اختر وظيفة')
                .addOptions([
                    { label: 'صيد السمك', value: 'fishing' },
                    { label: 'تكسي', value: 'taxi' },
                    { label: 'صيد الحيوانات', value: 'hunting' },
                    { label: 'منجم', value: 'mining' },
                ])
        );
        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
