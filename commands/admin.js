const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'admin',
    data: new SlashCommandBuilder().setName('admin').setDescription('Admin System & Admin Points'),
    async execute(message, args, db) {
        const { embed, menu } = await build(db);
        message.channel.send({ embeds: [embed], components: [menu, resetRow('admin')] });
    },
    async slashExecute(interaction, db) {
        const { embed, menu } = await build(db);
        const main = { embeds: [embed], components: [menu, resetRow('admin')] };
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.reply({ content: '​', flags: 64 });
    }
};

async function build(db) {
    const embed = new EmbedBuilder()
        .setTitle('Admin System')
        .setColor(0xF9A825)
        .setDescription('Admin control panel — choose from the menu below.')
        .setFooter({ text: 'Admin System • FANTASY Bot' })
        .setTimestamp();
    const img = await db.getImage('admin');
    if (img) embed.setImage(img);
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('admin_menu')
            .setPlaceholder('Choose an option')
            .addOptions([
                { label: '🏅 View Ranks', value: 'ranks' },
                { label: '⭐ Admin Points', value: 'points' },
                { label: '👥 Manage Players', value: 'manage' },
                { label: '📋 Action Log', value: 'logs' },
            ])
    );
    return { embed, menu };
}
