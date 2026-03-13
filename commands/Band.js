const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'police',
    data: new SlashCommandBuilder()
        .setName('police')
        .setDescription('نظام الشرطة'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('الشرطة')
            .setDescription('اختر أمر شرطة')
            .setColor('Red')
            .setImage(await db.getImage('police') || null);
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('police_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: 'كلبشة', value: 'handcuff' },
                    { label: 'تلويت', value: 'wanted' },
                    { label: 'باند', value: 'ban' },
                    { label: 'تشهير', value: 'defame' },
                ])
        );
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('الشرطة')
            .setDescription('اختر أمر شرطة')
            .setColor('Red')
            .setImage(await db.getImage('police') || null);
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('police_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: 'كلبشة', value: 'handcuff' },
                    { label: 'تلويت', value: 'wanted' },
                    { label: 'باند', value: 'ban' },
                    { label: 'تشهير', value: 'defame' },
                ])
        );
        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
