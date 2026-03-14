const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'jobs',
    data: new SlashCommandBuilder()
        .setName('jobs')
        .setDescription('عرض الوظائف الحرة'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('💼 الوظائف الحرة')
            .setColor(0xF57F17)
            .setDescription('اختر وظيفتك وابدأ الكسب')
            .addFields(
                { name: '🎣 صيد السمك', value: 'توجه لمنطقة الصيد', inline: true },
                { name: '🚕 تكسي', value: 'توجه لمحطة التكسي', inline: true },
                { name: '🦌 صيد الحيوانات', value: 'توجه للغابة', inline: true },
                { name: '⛏️ منجم', value: 'توجه للمنجم', inline: true },
            )
            .setImage(await db.getImage('jobs') || null)
            .setFooter({ text: 'نظام الوظائف • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('jobs_menu')
                .setPlaceholder('اختر وظيفتك')
                .addOptions([
                    { label: '🎣 صيد السمك', value: 'fishing' },
                    { label: '🚕 تكسي', value: 'taxi' },
                    { label: '🦌 صيد الحيوانات', value: 'hunting' },
                    { label: '⛏️ منجم', value: 'mining' },
                ])
        );
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('💼 الوظائف الحرة')
            .setColor(0xF57F17)
            .setDescription('اختر وظيفتك وابدأ الكسب')
            .addFields(
                { name: '🎣 صيد السمك', value: 'توجه لمنطقة الصيد', inline: true },
                { name: '🚕 تكسي', value: 'توجه لمحطة التكسي', inline: true },
                { name: '🦌 صيد الحيوانات', value: 'توجه للغابة', inline: true },
                { name: '⛏️ منجم', value: 'توجه للمنجم', inline: true },
            )
            .setImage(await db.getImage('jobs') || null)
            .setFooter({ text: 'نظام الوظائف • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('jobs_menu')
                .setPlaceholder('اختر وظيفتك')
                .addOptions([
                    { label: '🎣 صيد السمك', value: 'fishing' },
                    { label: '🚕 تكسي', value: 'taxi' },
                    { label: '🦌 صيد الحيوانات', value: 'hunting' },
                    { label: '⛏️ منجم', value: 'mining' },
                ])
        );
        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
