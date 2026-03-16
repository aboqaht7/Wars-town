const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

const OPTIONS = [
    { label: '🪪 الهوية', value: 'identity' },
    { label: '📱 الجوال', value: 'phone' },
    { label: '💬 الرسائل', value: 'sms' },
    { label: '𝕏 منصة X', value: 'x_platform' },
    { label: '🎒 الحقيبة', value: 'bag' },
    { label: '🏦 البنك', value: 'bank' },
    { label: '✈️ الرحلات والأحداث', value: 'events' },
    { label: '💼 الوظائف والأسواق', value: 'jobs' },
    { label: '🛒 سوق الأدوات', value: 'market' },
    { label: '⚖️ المحاماة', value: 'law' },
    { label: '🛡️ الإدارة', value: 'admin' },
    { label: '🔫 الجرائم', value: 'crime' },
    { label: '🎫 التكتات', value: 'tickets' },
    { label: '🚗 السيارات والمعرض', value: 'vehicles' },
];

module.exports = {
    name: 'help',
    data: new SlashCommandBuilder().setName('help').setDescription('عرض قائمة أنظمة البوت'),
    execute(message, args, db) {
        message.channel.send(build());
    },
    async slashExecute(interaction, db) {
        const main = build();
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.reply({ content: '​', flags: 64 });
    }
};

function build() {
    const embed = new EmbedBuilder()
        .setTitle('🤖 بوت FANTASY — قائمة الأنظمة')
        .setColor(0xE53935)
        .setDescription('اختر النظام من القائمة أدناه للاطلاع على تفاصيله.')
        .setFooter({ text: 'بوت FANTASY • نظام RP متكامل' })
        .setTimestamp();
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('help_menu')
            .setPlaceholder('اختر نظاماً للتفاصيل')
            .addOptions(OPTIONS)
    );
    return { embeds: [embed], components: [menu, resetRow('help')] };
}
