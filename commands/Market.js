const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'market',
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('سوق الأدوات والمزاد'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('السوق المركزي / Tools Market')
            .setDescription('اختر ما تريد شراءه')
            .setColor('Red')
            .setImage(await db.getImage('market') || null);
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('market_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: 'سنارة صيد', value: 'fishing_rod' },
                    { label: 'فأس', value: 'axe' },
                    { label: 'أدوات منجم', value: 'mining_tools' },
                    { label: 'مزاد السيارات والعقارات', value: 'auction' },
                ])
        );
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('السوق المركزي / Tools Market')
            .setDescription('اختر ما تريد شراءه')
            .setColor('Red')
            .setImage(await db.getImage('market') || null);
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('market_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: 'سنارة صيد', value: 'fishing_rod' },
                    { label: 'فأس', value: 'axe' },
                    { label: 'أدوات منجم', value: 'mining_tools' },
                    { label: 'مزاد السيارات والعقارات', value: 'auction' },
                ])
        );
        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
