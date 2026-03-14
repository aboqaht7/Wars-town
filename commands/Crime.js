const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'crime',
    data: new SlashCommandBuilder()
        .setName('crime')
        .setDescription('نظام الجرائم: سرقات وخطف'),
    async execute(message, args, db) {
        const { embed, menu } = await build(db);
        message.channel.send({ embeds: [embed], components: [menu, resetRow('crime')] });
    },
    async slashExecute(interaction, db) {
        const { embed, menu } = await build(db);
        interaction.reply({ embeds: [embed], components: [menu, resetRow('crime')] });
    }
};

async function build(db) {
    const embed = new EmbedBuilder()
        .setTitle('🔫 نظام الجرائم')
        .setColor(0xB71C1C)
        .setDescription('اختر نوع الجريمة التي تريد تنفيذها')
        .addFields(
            { name: '⚠️ تحذير', value: 'الجرائم تخضع لمراقبة الإدارة وقد تترتب عليها عواقب', inline: false },
        )
        .setImage(await db.getImage('crime') || null)
        .setFooter({ text: 'نظام الجرائم • بوت FANTASY' })
        .setTimestamp();
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('crime_menu')
            .setPlaceholder('اختر نوع الجريمة')
            .addOptions([
                { label: '💰 سرقة', value: 'robbery' },
                { label: '🪢 خطف', value: 'kidnap' },
                { label: '🎭 نصب واحتيال', value: 'fraud' },
                { label: '🔫 سطو مسلح', value: 'armed_robbery' },
            ])
    );
    return { embed, menu };
}
