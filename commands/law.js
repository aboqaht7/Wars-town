const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'محاماة',
    data: new SlashCommandBuilder().setName('محاماة').setDescription('⚖️ مكتب المحاماة'),

    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        message.channel.send(await build(db));
    },

    async slashExecute(interaction, db) {
        const main = await build(db);
        // جاء من زر Reset → عدّل الرسالة الحالية مباشرةً
        if (interaction._isReset) return interaction.message.edit(main);
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        await interaction.channel.send(main);
        await interaction.reply({ content: '​', flags: 64 });
    },
};

async function build(db) {
    const img = await db.getImage('محاماة');
    const embed = new EmbedBuilder()
        .setTitle('⚖️ مكتب المحاماة')
        .setColor(0x0D47A1)
        .setDescription('> اختر الخدمة القانونية من القائمة أدناه')
        .setFooter({ text: 'نظام المحاماة • بوت FANTASY' })
        .setTimestamp();
    if (img) embed.setImage(img);

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('law_menu')
            .setPlaceholder('⚖️ اختر خدمة قانونية')
            .addOptions([
                { label: '📁 رفع قضية',        value: 'new_case',    description: 'تقديم قضية جديدة إلى المحكمة' },
                { label: '📋 قضاياي',           value: 'my_cases',   description: 'عرض جميع القضايا المرفوعة منك' },
                { label: '👨‍⚖️ توكيل محامي',    value: 'hire_lawyer', description: 'طلب توكيل محامٍ لقضيتك' },
            ])
    );
    return { embeds: [embed], components: [menu, resetRow('محاماة')] };
}
