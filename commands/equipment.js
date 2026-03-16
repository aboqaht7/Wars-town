const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'معدات',
    data: new SlashCommandBuilder()
        .setName('معدات')
        .setDescription('🔨 متجر المعدات — اشترِ معداتك'),

    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const payload = await buildEquipment(db);
        message.channel.send(payload);
    },

    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const payload = await buildEquipment(db);
        if (interaction._isReset) return interaction.message.edit(payload);
        await interaction.channel.send(payload);
        await interaction.reply({ content: '​', flags: 64 });
    },

    buildEquipment,
};

async function buildEquipment(db) {
    const items = await db.getEquipmentItems();
    const img   = await db.getImage('معدات');

    const embed = new EmbedBuilder()
        .setTitle('🔨 متجر المعدات')
        .setColor(0x4527A0)
        .setFooter({ text: 'متجر المعدات • بوت FANTASY' })
        .setTimestamp();
    if (img) embed.setImage(img);

    if (!items.length) {
        embed.setDescription('> لا توجد معدات متاحة حالياً. انتظر الإدارة.');
        return { embeds: [embed], components: [resetRow('معدات')] };
    }

    embed.setDescription('اختر المعدة من القائمة أدناه.');

    const options = items.slice(0, 25).map(it => ({
        label: it.name,
        value: String(it.id),
        description: `💰 ${Number(it.price).toLocaleString()} ريال` +
            (it.description ? ` — ${it.description.slice(0, 40)}` : ''),
    }));

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('equipment_item_select')
            .setPlaceholder('🔨 اختر معدة')
            .addOptions(options)
    );

    return { embeds: [embed], components: [menu, resetRow('معدات')] };
}
