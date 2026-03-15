const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'jobs',
    data: new SlashCommandBuilder().setName('jobs').setDescription('عرض الوظائف الحرة'),
    async execute(message, args, db) {
        const { embed, menu } = await build(db);
        message.channel.send({ embeds: [embed], components: [menu, resetRow('jobs')] });
    },
    async slashExecute(interaction, db) {
        const { embed, menu } = await build(db);
        interaction.reply({ embeds: [embed], components: [menu, resetRow('jobs')] , flags: 64 });
    }
};

async function build(db) {
    const embed = new EmbedBuilder()
        .setTitle('💼 الوظائف الحرة')
        .setColor(0xF57F17)
        .setDescription('اختر وظيفتك وابدأ الكسب.')
        .setFooter({ text: 'نظام الوظائف • بوت FANTASY' })
        .setTimestamp();
    const img = await db.getImage('jobs');
    if (img) embed.setImage(img);
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('jobs_menu')
            .setPlaceholder('اختر وظيفتك')
            .addOptions([
                { label: '🎣 صيد السمك', value: 'fishing' },
                { label: '🚕 تكسي', value: 'taxi' },
                { label: '🦌 صيد الحيوانات', value: 'hunting' },
                { label: '⛏️ منجم', value: 'mining' },
            ])
    );
    return { embed, menu };
}
