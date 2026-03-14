const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const OPTIONS = [
    { label: '🪪 الهوية', value: 'identity' },
    { label: '📱 الجوال', value: 'phone' },
    { label: '🎒 الحقيبة', value: 'bag' },
    { label: '🏦 البنك', value: 'bank' },
    { label: '👮 الشرطة', value: 'police' },
    { label: '✈️ الرحلات والأحداث', value: 'events' },
    { label: '💼 الوظائف والأسواق', value: 'jobs' },
    { label: '🛒 سوق الأدوات', value: 'market' },
    { label: '⚖️ المحاماة', value: 'law' },
    { label: '🛡️ الإدارة', value: 'admin' },
    { label: '🔫 الجرائم', value: 'crime' },
    { label: '🎫 التكتات', value: 'tickets' },
    { label: '🚗 السيارات', value: 'vehicles' },
    { label: '🏎️ معرض السيارات', value: 'showroom' },
];

function buildEmbed() {
    return new EmbedBuilder()
        .setTitle('🤖 بوت FANTASY — قائمة الأنظمة')
        .setColor(0xE53935)
        .setDescription('اختر النظام من القائمة أدناه للاطلاع على تفاصيله')
        .addFields(
            { name: '🪪 الهوية', value: '`/identity`', inline: true },
            { name: '📱 الجوال', value: '`/phone`', inline: true },
            { name: '🎒 الحقيبة', value: '`/bag`', inline: true },
            { name: '🏦 البنك', value: '`/bank`', inline: true },
            { name: '👮 الشرطة', value: '`/police`', inline: true },
            { name: '✈️ الأحداث', value: '`/events`', inline: true },
            { name: '💼 الوظائف', value: '`/jobs`', inline: true },
            { name: '🛒 السوق', value: '`/market`', inline: true },
            { name: '⚖️ المحاماة', value: '`/law`', inline: true },
            { name: '🛡️ الإدارة', value: '`/admin`', inline: true },
            { name: '🔫 الجرائم', value: '`/crime`', inline: true },
            { name: '🎫 التكتات', value: '`/tickets`', inline: true },
            { name: '🚗 السيارات', value: '`/سيارات`', inline: true },
            { name: '🏎️ المعرض', value: '`/معارض`', inline: true },
        )
        .setFooter({ text: 'بوت FANTASY • نظام RP متكامل' })
        .setTimestamp();
}

function buildMenu() {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('help_menu')
            .setPlaceholder('اختر نظاماً للتفاصيل')
            .addOptions(OPTIONS)
    );
}

module.exports = {
    name: 'help',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('عرض قائمة أنظمة البوت'),
    execute(message, args, db) {
        message.channel.send({ embeds: [buildEmbed()], components: [buildMenu()] });
    },
    slashExecute(interaction, db) {
        interaction.reply({ embeds: [buildEmbed()], components: [buildMenu()] });
    }
};
