const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'health',
    data: new SlashCommandBuilder()
        .setName('health')
        .setDescription('نظام وزارة الصحة'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('وزارة الصحة')
            .setDescription('اختر الخدمة الطبية')
            .setColor('Red')
            .setImage(await db.getImage('health') || null);

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('health_menu')
                .setPlaceholder('اختر الخدمة')
                .addOptions([
                    { label: 'إنعاش مستشفى', value: 'hospital_resuscitation' },
                    { label: 'تحلل', value: 'decay' },
                    { label: 'إنعاش ساحرة', value: 'witch_resuscitation' }
                ])
        );

        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('وزارة الصحة')
            .setDescription('اختر الخدمة الطبية')
            .setColor('Red')
            .setImage(await db.getImage('health') || null);

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('health_menu')
                .setPlaceholder('اختر الخدمة')
                .addOptions([
                    { label: 'إنعاش مستشفى', value: 'hospital_resuscitation' },
                    { label: 'تحلل', value: 'decay' },
                    { label: 'إنعاش ساحرة', value: 'witch_resuscitation' }
                ])
        );

        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
