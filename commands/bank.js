const {
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');
const { resetRow } = require('../utils');

const SLOT_NAMES = { 1: 'الشخصية الأولى', 2: 'الشخصية الثانية', 3: 'الشخصية الثالثة' };

function bankMenu(imageUrl) {
    const menu = new StringSelectMenuBuilder()
        .setCustomId('bank_menu')
        .setPlaceholder('اختر خدمة بنكية...')
        .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('💰 رصيدي').setValue('balance').setDescription('عرض رصيدك وإيبانك'),
            new StringSelectMenuOptionBuilder().setLabel('💸 تحويل').setValue('transfer').setDescription('تحويل مبلغ لإيبان آخر'),
            new StringSelectMenuOptionBuilder().setLabel('📋 سجل المعاملات').setValue('history').setDescription('آخر 15 معاملة'),
        );
    const row = new ActionRowBuilder().addComponents(menu);
    const embed = new EmbedBuilder()
        .setTitle('🏦 بنك FANTASY')
        .setColor(0x1565C0)
        .setDescription('مرحباً بك في البنك. اختر الخدمة المطلوبة من القائمة.')
        .setFooter({ text: 'نظام البنك • بوت FANTASY' })
        .setTimestamp();
    if (imageUrl) embed.setImage(imageUrl);
    return { embeds: [embed], components: [row, resetRow('bank')] };
}

module.exports = {
    name: 'بنك',
    data: new SlashCommandBuilder()
        .setName('بنك')
        .setDescription('افتح قائمة البنك'),

    async execute(message, args, db) {
        const img = await db.getImage('bank');
        message.channel.send(bankMenu(img));
    },

    async slashExecute(interaction, db) {
        const img = await db.getImage('bank');
        interaction.reply({ ...bankMenu(img), flags: 64 });
    },

    bankMenu,
    SLOT_NAMES,
};
