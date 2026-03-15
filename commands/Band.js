const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'police',
    data: new SlashCommandBuilder().setName('police').setDescription('نظام الشرطة'),
    async execute(message, args, db) {
        const { embed, menu } = await build(db);
        message.channel.send({ embeds: [embed], components: [menu, resetRow('police')] });
    },
    async slashExecute(interaction, db) {
        const { embed, menu } = await build(db);
        interaction.reply({ embeds: [embed], components: [menu, resetRow('police')] , flags: 64 });
    }
};

async function build(db) {
    const embed = new EmbedBuilder()
        .setTitle('👮 نظام الشرطة')
        .setColor(0x1565C0)
        .setDescription('مرحباً بك في نظام الشرطة — اختر الإجراء من القائمة.')
        .setFooter({ text: 'نظام الشرطة • بوت FANTASY' })
        .setTimestamp();
    const img = await db.getImage('police');
    if (img) embed.setImage(img);
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('police_menu')
            .setPlaceholder('اختر خيار')
            .addOptions([
                { label: '🔗 كلبشة', value: 'handcuff' },
                { label: '🚨 تلويت', value: 'wanted' },
                { label: '🚫 باند', value: 'ban' },
                { label: '📢 تشهير', value: 'defame' },
                { label: '🔓 فك كلبشة', value: 'unchuff' },
            ])
    );
    return { embed, menu };
}
