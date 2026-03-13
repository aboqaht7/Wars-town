const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'crime',
    data: new SlashCommandBuilder()
        .setName('crime')
        .setDescription('نظام الجرائم: سرقات وخطف'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('الجرائم')
            .setDescription('اختر نوع الجريمة')
            .setColor('Red')
            .setImage(await db.getImage('crime') || null);
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('crime_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: 'سرقة', value: 'robbery' },
                    { label: 'خطف', value: 'kidnap' },
                    { label: 'نصب واحتيال', value: 'fraud' },
                    { label: 'سطو مسلح', value: 'armed_robbery' },
                ])
        );
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('الجرائم')
            .setDescription('اختر نوع الجريمة')
            .setColor('Red')
            .setImage(await db.getImage('crime') || null);
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('crime_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: 'سرقة', value: 'robbery' },
                    { label: 'خطف', value: 'kidnap' },
                    { label: 'نصب واحتيال', value: 'fraud' },
                    { label: 'سطو مسلح', value: 'armed_robbery' },
                ])
        );
        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
