const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
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
        .setDescription('اكتشف محتويات حقيبتك واختر ما تريد.')
        .setFooter({ text: 'نظام الحقيبة • بوت FANTASY' })
        .setTimestamp();
    if (image) embed.setImage(image);
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('bag_menu')
            .setPlaceholder('اختر خيار')
            .addOptions([
                { label: '👀 عرض الأغراض', value: 'view' },
                { label: '📤 كيفية نقل الأغراض', value: 'transfer_help' },
            ])
    );
    return { embeds: [embed], components: [menu, resetRow('bag')] };
}
