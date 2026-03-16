const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'properties',
    data: new SlashCommandBuilder().setName('properties').setDescription('عرض العقارات المتاحة للشراء'),

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
    const props = await db.getProperties();
    const embed = new EmbedBuilder()
        .setTitle('🏠 معرض العقارات')
        .setColor(0xB71C1C)
        .setDescription(props.length
            ? 'اختر العقار الذي تريد الاستفسار عنه أو شراؤه من القائمة.'
            : '> لا توجد عقارات متاحة حالياً. انتظر الإدارة.')
        .setFooter({ text: 'نظام العقارات • بوت FANTASY' })
        .setTimestamp();
    const img = await db.getImage('properties');
    if (img) embed.setImage(img);

    if (!props.length) return { embeds: [embed], components: [resetRow('properties')] };

    const options = props.slice(0, 25).map(p => ({
        label: p.name,
        value: String(p.id),
        description: `💰 ${Number(p.price).toLocaleString()} ريال`,
    }));

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('properties_menu')
            .setPlaceholder('🏠 اختر العقار')
            .addOptions(options)
    );
    return { embeds: [embed], components: [menu, resetRow('properties')] };
}
