const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'health',
    data: new SlashCommandBuilder().setName('health').setDescription('Ministry of Health System'),
    async execute(message, args, db) {
        const { embed, menu } = await build(db);
        message.channel.send({ embeds: [embed], components: [menu, resetRow('health')] });
    },
    async slashExecute(interaction, db) {
        const { embed, menu } = await build(db);
        const main = { embeds: [embed], components: [menu, resetRow('health')] };
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.reply({ content: '​', flags: 64 });
    }
};

async function build(db) {
    const embed = new EmbedBuilder()
        .setTitle('Ministry of Health')
        .setColor(0x1B5E20)
        .setDescription('Choose the medical service you need.')
        .setFooter({ text: 'Health System • FANTASY Bot' })
        .setTimestamp();
    const img = await db.getImage('health');
    if (img) embed.setImage(img);
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('health_menu')
            .setPlaceholder('Choose a medical service')
            .addOptions([
                { label: '🏥 Hospital Resuscitation', value: 'hospital_resuscitation' },
                { label: '💀 Decay', value: 'decay' },
                { label: '🧙 Witch Resuscitation', value: 'witch_resuscitation' },
            ])
    );
    return { embed, menu };
}
