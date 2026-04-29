const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetOption } = require('../utils');
const { loadSystemBtns, makeMenuOption } = require('../btnConfig');

async function build(db) {
    const embed = new EmbedBuilder()
        .setTitle('Ministry of Health')
        .setColor(0x1B5E20)
        .setDescription('اختر الخدمة الطبية التي تحتاجها.')
        .setFooter({ text: 'Health System • FANTASY Bot' })
        .setTimestamp();
    const img = await db.getImage('health').catch(() => null);
    if (img) embed.setImage(img);

    const mc = await loadSystemBtns(db, 'health_menu');
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('health_menu')
            .setPlaceholder('🏥 اختر خدمة طبية')
            .addOptions([
                makeMenuOption('hospital_resuscitation', mc.hospital_resuscitation),
                makeMenuOption('witch_resuscitation',    mc.witch_resuscitation),
                makeMenuOption('decay',                  mc.decay),
                resetOption('health'),
            ])
    );
    return { embeds: [embed], components: [menu] };
}

module.exports = {
    name: 'health',
    data: new SlashCommandBuilder().setName('health').setDescription('Ministry of Health System'),
    async execute(message, args, db) {
        const payload = await build(db);
        message.channel.send(payload);
    },
    async slashExecute(interaction, db) {
        const payload = await build(db);
        if (interaction._isReset) return interaction.message.edit(payload);
        await interaction.channel.send(payload);
        await interaction.reply({ content: '​', flags: 64 });
    },
    build,
};
