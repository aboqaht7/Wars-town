const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow, isAdmin } = require('../utils');

module.exports = {
    name: 'عدل',
    data: new SlashCommandBuilder().setName('عدل').setDescription('🏛️ نظام العدل — إدارة القضايا'),

    async execute(message, args, db) {
        if (!(await isAdmin(message.member, db))) return message.reply('❌ هذا الأمر للإدارة فقط.');
        message.channel.send(await build(db));
    },

    async slashExecute(interaction, db) {
        const main = await build(db);
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.reply({ content: '​', flags: 64 });
    },
};

async function build(db) {
    const img = await db.getImage('عدل');
    const embed = new EmbedBuilder()
        .setTitle('🏛️ نظام العدل')
        .setColor(0x4A148C)
        .setDescription('> إدارة القضايا المرفوعة — اختر الإجراء من القائمة')
        .setFooter({ text: 'نظام العدل • بوت FANTASY' })
        .setTimestamp();
    if (img) embed.setImage(img);

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('justice_menu')
            .setPlaceholder('🏛️ اختر إجراء')
            .addOptions([
                { label: '✅ قبول قضية',       value: 'accept_case',   description: 'قبول قضية معلقة' },
                { label: '❌ رفض قضية',        value: 'reject_case',   description: 'رفض قضية مع ذكر السبب' },
                { label: '👨‍⚖️ توكيل قاضي',   value: 'assign_judge',  description: 'تعيين قاضٍ لقضية مقبولة' },
                { label: '📜 إصدار حكم',       value: 'issue_verdict', description: 'إصدار الحكم النهائي لقضية جارية' },
            ])
    );
    return { embeds: [embed], components: [menu, resetRow('عدل')] };
}
