const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'crime',
    data: new SlashCommandBuilder().setName('crime').setDescription('نظام السرقات'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const payload = await build(db);
        message.channel.send(payload);
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const payload = await build(db);
        if (interaction._isReset) return interaction.message.edit(payload);
        await interaction.channel.send(payload);
        await interaction.reply({ content: '​', flags: 64 });
    }
};

async function build(db) {
    const robberies = await db.getRobberies();
    const embed = new EmbedBuilder()
        .setTitle('⛓️ نظام السرقات')
        .setColor(0xB71C1C)
        .setDescription(robberies.length
            ? 'اختر السرقة التي تريد تنفيذها من القائمة.'
            : '> لا توجد سرقات متاحة حالياً. انتظر الإدارة.')
        .setFooter({ text: 'نظام السرقات • بوت FANTASY' })
        .setTimestamp();
    const img = await db.getImage('crime');
    if (img) embed.setImage(img);

    if (!robberies.length) return { embeds: [embed], components: [resetRow('crime')] };

    const options = robberies.slice(0, 25).map(r => ({
        label: r.name,
        value: String(r.id),
        description: `💵 ${Number(r.min_money).toLocaleString()} — ${Number(r.max_money).toLocaleString()} ريال`,
    }));

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('robbery_menu')
            .setPlaceholder('⛓️ اختر السرقة')
            .addOptions(options)
    );
    return { embeds: [embed], components: [menu, resetRow('crime')] };
}
