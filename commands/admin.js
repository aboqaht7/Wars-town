const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'admin',
    data: new SlashCommandBuilder().setName('admin').setDescription('نظام الإدارة ونقاط الإدارة'),
    async execute(message, args, db) {
        const { embed, menu } = await build(db);
        message.channel.send({ embeds: [embed], components: [menu, resetRow('admin')] });
    },
    async slashExecute(interaction, db) {
        const { embed, menu } = await build(db);
        const main = { embeds: [embed], components: [menu, resetRow('admin')] };
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.reply({ content: '​', flags: 64 });
    }
};

async function build(db) {
    const embed = new EmbedBuilder()
        .setTitle('🛡️ نظام الإدارة')
        .setColor(0xF9A825)
        .setDescription('لوحة تحكم الإدارة — اختر من القائمة أدناه.')
        .setFooter({ text: 'نظام الإدارة • بوت FANTASY' })
        .setTimestamp();
    const img = await db.getImage('admin');
    if (img) embed.setImage(img);
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('admin_menu')
            .setPlaceholder('اختر خيار')
            .addOptions([
                { label: '🏅 عرض الرتب', value: 'ranks' },
                { label: '⭐ نقاط الإدارة', value: 'points' },
                { label: '👥 إدارة اللاعبين', value: 'manage' },
                { label: '📋 سجل الإجراءات', value: 'logs' },
            ])
    );
    return { embed, menu };
}
