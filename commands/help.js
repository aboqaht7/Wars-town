const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('عرض قائمة أنظمة البوت'),
    execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('قائمة أنظمة البوت')
            .setDescription('اختر النظام من القائمة أدناه')
            .setColor('Red');
        message.channel.send({ embeds: [embed] });
    },
    slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('قائمة أنظمة البوت')
            .setDescription('اختر النظام من القائمة أدناه')
            .setColor('Red');

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('help_menu')
                .setPlaceholder('اختر نظام')
                .addOptions([
                    { label: 'الهوية', value: 'identity' },
                    { label: 'الجوال', value: 'phone' },
                    { label: 'الحقيبة', value: 'bag' },
                    { label: 'البنك', value: 'bank' },
                    { label: 'الشرطة', value: 'police' },
                    { label: 'الرحلات والأحداث', value: 'events' },
                    { label: 'الوظائف والأسواق', value: 'jobs' },
                    { label: 'سوق الأدوات', value: 'market' },
                    { label: 'المحاماة', value: 'law' },
                    { label: 'الإدارة', value: 'admin' },
                    { label: 'الجرائم', value: 'crime' },
                    { label: 'التكتات', value: 'tickets' }
                ])
        );

        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
