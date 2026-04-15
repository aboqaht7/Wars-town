const {
    SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits,
    ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');

module.exports = {
    name: 'وزارة-التجارة',
    data: new SlashCommandBuilder()
        .setName('وزارة-التجارة')
        .setDescription('Ministry of Commerce control panel'),

    async slashExecute(interaction, db) {
        const _img = await db.getImage('market').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('Ministry of Commerce')
            .setColor(0x1565C0)
            .setDescription('Welcome to the Ministry of Commerce control panel. Choose one of the options below.')
            .setFooter({ text: 'Ministry of Commerce • FANTASY Bot' })
            .setTimestamp();

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ministry_login_btn').setLabel('Login').setEmoji('🟢').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ministry_logout_btn').setLabel('Logout').setEmoji('🔴').setStyle(ButtonStyle.Danger),
        );
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ministry_companies_btn').setLabel('View Registered Companies').setEmoji('🏢').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ministry_approve_btn').setLabel('Approve Company').setEmoji('✅').setStyle(ButtonStyle.Success),
        );

        await interaction.reply({ content: '\u200b', flags: 64 });
        if (_img) embed.setImage(_img);
        return interaction.channel.send({ embeds: [embed], components: [row1, row2] });

    },
};
