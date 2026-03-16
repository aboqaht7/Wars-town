const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'الرحلات',
    data: new SlashCommandBuilder()
        .setName('الرحلات')
        .setDescription('نظام الرحلات'),

    async execute(message, args, db) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('❌ هذا الأمر للمسؤولين فقط.');
        const payload = await build(db);
        message.channel.send(payload);
    },

    async slashExecute(interaction, db) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: '❌ هذا الأمر للمسؤولين فقط.', flags: 64 });
        const payload = await build(db);
        if (interaction._isReset) return interaction.message.edit(payload);
        await interaction.channel.send(payload);
        await interaction.reply({ content: '​', flags: 64 });
    }
};

async function build(db) {
    const embed = new EmbedBuilder()
        .setTitle('✈️ نظام الرحلات')
        .setColor(0xB71C1C)
        .setDescription(
            '> اختر الإجراء المطلوب من الأزرار أدناه.\n\n' +
            '✈️ **بدء رحلة** — فتح رحلة جديدة وإرسال الإشعار\n' +
            '🌪️ **إعصار** — إنهاء الرحلة وإرسال تحذير الإعصار\n' +
            '🔄 **تجديد** — تجديد رحلة بمعرف الهوست\n' +
            '📣 **تنبيه** — إرسال تنبيه مخصص لروم التنبيهات'
        )
        .setFooter({ text: 'نظام الرحلات • بوت FANTASY' })
        .setTimestamp();

    const img = await db.getImage('الرحلات');
    if (img) embed.setImage(img);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('trip_start').setLabel('بدء رحلة').setStyle(ButtonStyle.Success).setEmoji('✈️'),
        new ButtonBuilder().setCustomId('trip_hurricane').setLabel('إعصار').setStyle(ButtonStyle.Danger).setEmoji('🌪️'),
        new ButtonBuilder().setCustomId('trip_renewal').setLabel('تجديد').setStyle(ButtonStyle.Primary).setEmoji('🔄'),
        new ButtonBuilder().setCustomId('trip_alert').setLabel('تنبيه').setStyle(ButtonStyle.Secondary).setEmoji('📣'),
    );

    return { embeds: [embed], components: [row, resetRow('الرحلات')] };
}
