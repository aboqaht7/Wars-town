const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetOption } = require('../utils');
const { loadSystemBtns, makeMenuOption } = require('../btnConfig');

async function build(db) {
    const embed = new EmbedBuilder()
        .setTitle('Admin System')
        .setColor(0xF9A825)
        .setDescription('لوحة تحكم الإدارة — اختر من القائمة أدناه.')
        .setFooter({ text: 'Admin System • FANTASY Bot' })
        .setTimestamp();
    const img = await db.getImage('admin').catch(() => null);
    if (img) embed.setImage(img);

    const mc = await loadSystemBtns(db, 'admin_menu');
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('admin_menu')
            .setPlaceholder('اختر خياراً')
            .addOptions([
                makeMenuOption('ranks',  mc.ranks),
                makeMenuOption('points', mc.points),
                makeMenuOption('manage', mc.manage),
                makeMenuOption('logs',   mc.logs),
                resetOption('admin'),
            ])
    );
    return { embeds: [embed], components: [menu] };
}

module.exports = {
    name: 'admin',
    data: new SlashCommandBuilder().setName('admin').setDescription('Admin System & Admin Points'),
    async execute(message, args, db) {
        message.channel.send(await build(db));
    },
    async slashExecute(interaction, db) {
        const payload = await build(db);
        if (interaction._isReset) return interaction.message.edit(payload);
        await interaction.channel.send(payload);
        await interaction.reply({ content: '​', flags: 64 });
    },
};
