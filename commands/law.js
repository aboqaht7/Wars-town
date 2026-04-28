const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow, resetOption } = require('../utils');

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
        const main = await build(db);
        // جاء من زر Reset → عدّل الرسالة الحالية مباشرةً
        if (interaction._isReset) return interaction.message.edit(main);
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        await interaction.channel.send(main);
        await interaction.reply({ content: '​', flags: 64 });
    },
};

async function build(db) {
    const img = await db.getImage('محاماة');
    const embed = new EmbedBuilder()
        .setTitle('Law Office')
        .setColor(0x0D47A1)
        .setDescription('> Choose the legal service from the menu below')
        .setFooter({ text: 'Law System • FANTASY Bot' })
        .setTimestamp();
    if (img) embed.setImage(img);

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('law_menu')
            .setPlaceholder('⚖️ Choose a legal service')
            .addOptions([
                { label: '📁 File a Case',        value: 'new_case',    description: 'Submit a new case to the court' },
                { label: '📋 My Cases',           value: 'my_cases',   description: 'View all cases filed by you' },
                { label: '👨‍⚖️ Hire a Lawyer',    value: 'hire_lawyer', description: 'Request a lawyer for your case' },
            
                resetOption('محاماة'),
            ])
    );
    return { embeds: [embed], components: [menu] };
}
