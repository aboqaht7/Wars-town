const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'bag',
    data: new SlashCommandBuilder().setName('bag').setDescription('عرض الحقيبة والأغراض'),
    async execute(message, args, db) {
        const img = await db.getImage('bag');
        message.channel.send(build(img));
    },
    async slashExecute(interaction, db) {
        const img = await db.getImage('bag');
        interaction.reply(build(img));
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
