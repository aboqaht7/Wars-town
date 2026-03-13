const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'identity',
    data: new SlashCommandBuilder()
        .setName('identity')
        .setDescription('عرض الهوية'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('الهوية')
            .setDescription('شخصيتك الحالية')
            .setColor('Red')
            .setImage(await db.getImage('identity') || '');
        message.channel.send({ embeds: [embed] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('الهوية')
            .setDescription('شخصيتك الحالية')
            .setColor('Red')
            .setImage(await db.getImage('identity') || '');

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('identity_menu')
                .setPlaceholder('اختر شخصية')
                .addOptions([
                    { label: 'شخصية 1', value: 'char1' },
                    { label: 'شخصية 2', value: 'char2' },
                    { label: 'شخصية 3 (مقفلة)', value: 'char3' },
                    { label: 'شخصية 4 (مقفلة)', value: 'char4' }
                ])
        );

        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
