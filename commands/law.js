const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetOption } = require('../utils');
const { loadSystemBtns, makeMenuOption } = require('../btnConfig');

async function build(db) {
    const img = await db.getImage('محاماة').catch(() => null);
    const embed = new EmbedBuilder()
        .setTitle('Law Office')
        .setColor(0x0D47A1)
        .setDescription('> اختر الخدمة القانونية من القائمة أدناه')
        .setFooter({ text: 'Law System • FANTASY Bot' })
        .setTimestamp();
    if (img) embed.setImage(img);

    const mc = await loadSystemBtns(db, 'law_menu');
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('law_menu')
            .setPlaceholder('⚖️ اختر خدمة قانونية')
            .addOptions([
                makeMenuOption('new_case',    mc.new_case),
                makeMenuOption('my_cases',    mc.my_cases),
                makeMenuOption('hire_lawyer', mc.hire_lawyer),
                resetOption('محاماة'),
            ])
    );
    return { embeds: [embed], components: [menu] };
}

module.exports = {
    name: 'محاماة',
    data: new SlashCommandBuilder().setName('محاماة').setDescription('⚖️ Law Office'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        message.channel.send(await build(db));
    },
    async slashExecute(interaction, db) {
        const payload = await build(db);
        if (interaction._isReset) return interaction.message.edit(payload);
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        await interaction.channel.send(payload);
        await interaction.reply({ content: '​', flags: 64 });
    },
};
