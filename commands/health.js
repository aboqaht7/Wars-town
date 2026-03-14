const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'health',
    data: new SlashCommandBuilder().setName('health').setDescription('نظام وزارة الصحة'),
    async execute(message, args, db) {
        const { embed, menu } = await build(db);
        message.channel.send({ embeds: [embed], components: [menu, resetRow('health')] });
    },
    async slashExecute(interaction, db) {
        const { embed, menu } = await build(db);
        interaction.reply({ embeds: [embed], components: [menu, resetRow('health')] });
    }
};

async function build(db) {
    const embed = new EmbedBuilder()
        .setTitle('🏥 وزارة الصحة')
        .setColor(0x1B5E20)
        .setDescription('اختر الخدمة الطبية التي تحتاجها.')
        .setFooter({ text: 'نظام الصحة • بوت FANTASY' })
        .setTimestamp();
    const img = await db.getImage('health');
    if (img) embed.setImage(img);
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('health_menu')
            .setPlaceholder('اختر الخدمة الطبية')
            .addOptions([
                { label: '🏥 إنعاش مستشفى', value: 'hospital_resuscitation' },
                { label: '💀 تحلل', value: 'decay' },
                { label: '🧙 إنعاش ساحرة', value: 'witch_resuscitation' },
            ])
    );
    return { embed, menu };
}
