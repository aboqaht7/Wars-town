const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const { resetRow } = require('../utils');
const db = require('../database');

async function build() {
    const embed = new EmbedBuilder()
        .setTitle('📱 الجوال')
        .setColor(0x1565C0)
        .setDescription('اختر نوع البلاغ الذي تريد إرساله.')
        .setFooter({ text: 'نظام البلاغات • بوت FANTASY' })
        .setTimestamp();

    const img = await db.getImage('phone');
    if (img) embed.setImage(img);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('report_police').setLabel('🚨 بلاغ شرطة').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('report_ambulance').setLabel('🚑 بلاغ إسعاف').setStyle(ButtonStyle.Primary),
    );

    return { embeds: [embed], components: [row, resetRow('phone')] };
}

module.exports = {
    name: 'phone',
    data: new SlashCommandBuilder().setName('phone').setDescription('الجوال — إرسال بلاغات الشرطة والإسعاف'),

    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        message.channel.send(await build());
    },

    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        interaction.reply(await build());
    },
};
