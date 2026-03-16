const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'bag',
    data: new SlashCommandBuilder().setName('bag').setDescription('عرض الحقيبة والأغراض'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const img = await db.getImage('bag');
        message.channel.send(build(img));
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const img = await db.getImage('bag');
        const main = build(img);
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.reply({ content: '​', flags: 64 });
    }
};

function build(image) {
    const embed = new EmbedBuilder()
        .setTitle('🎒 الحقيبة')
        .setColor(0xE65100)
        .setDescription('اختر ما تريد فعله بحقيبتك.')
        .setFooter({ text: 'نظام الحقيبة • بوت FANTASY' })
        .setTimestamp();
    if (image) embed.setImage(image);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('bag_view').setLabel('👀 عرض الحقيبة').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('bag_use').setLabel('✅ استخدام غرض').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('bag_transfer').setLabel('📤 تحويل غرض').setStyle(ButtonStyle.Secondary),
    );

    return { embeds: [embed], components: [row, resetRow('bag')] };
}
