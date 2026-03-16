const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, StringSelectMenuBuilder,
} = require('discord.js');
const { resetRow } = require('../utils');
const db = require('../database');

async function build() {
    const img = await db.getImage('phone');

    const embed = new EmbedBuilder()
        .setTitle('📱 الجوال')
        .setColor(0x1565C0)
        .setDescription('> اختر الخدمة التي تريدها من القائمة أدناه')
        .setFooter({ text: 'نظام الجوال • بوت FANTASY' })
        .setTimestamp();

    if (img) embed.setImage(img);

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('phone_menu')
            .setPlaceholder('📱 اختر الخدمة')
            .addOptions([
                {
                    label: '🚨 بلاغ شرطة',
                    value: 'report_police',
                    description: 'إرسال بلاغ لفريق الشرطة',
                },
                {
                    label: '🚑 بلاغ إسعاف',
                    value: 'report_ambulance',
                    description: 'إرسال بلاغ لفريق الإسعاف',
                },
            ])
    );

    return { embeds: [embed], components: [menu, resetRow('phone')] };
}

module.exports = {
    name: 'phone',
    data: new SlashCommandBuilder().setName('phone').setDescription('📱 الجوال'),

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
        const main = await build();
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.reply({ content: '​', flags: 64 });
    },
};
