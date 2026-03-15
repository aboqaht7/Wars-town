const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
} = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'سناب',
    data: new SlashCommandBuilder().setName('سناب').setDescription('سناب شات — الرسائل والأصدقاء'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const account = await db.getSnapAccount(message.author.id);
        const img = await db.getImage('سناب شات');
        message.channel.send(buildSnap(account, img));
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const account = await db.getSnapAccount(interaction.user.id);
        const img = await db.getImage('سناب شات');
        await interaction.channel.send(buildSnap(account, img));
        await interaction.reply({ content: '​', flags: 64 });
    },
    buildSnap,
};

function buildSnap(account, image) {
    const embed = new EmbedBuilder()
        .setTitle('👻 سناب شات')
        .setColor(0xFFFC00)
        .setDescription('أرسل سنابات وتواصل مع أصدقائك.')
        .setFooter({ text: 'سناب شات • بوت FANTASY' })
        .setTimestamp();
    if (image) embed.setImage(image);

    if (!account) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('snap_create').setLabel('✨ إنشاء حساب').setStyle(ButtonStyle.Primary),
        );
        return { embeds: [embed], components: [row, resetRow('سناب')] };
    }

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('snap_menu')
            .setPlaceholder('👻 اختر من القائمة')
            .addOptions([
                { label: '📸 إرسال سناب',    value: 'snap_send',     description: 'أرسل سناب لصديق' },
                { label: '📬 الوارد',          value: 'snap_inbox',    description: 'شوف السنابات اللي وصلتك' },
                { label: '👥 أصدقائي',        value: 'snap_friends',  description: 'قائمة أصدقائك والستريك' },
                { label: '➕ إضافة صديق',     value: 'snap_add',      description: 'أضف صديق باسم حساب سناب' },
                { label: '🔔 طلبات الصداقة',  value: 'snap_requests', description: 'اقبل طلبات الصداقة' },
            ])
    );

    return { embeds: [embed], components: [menu, resetRow('سناب')] };
}
