const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, StringSelectMenuBuilder,
} = require('discord.js');
const { resetRow } = require('../utils');
const { loadSystemBtns, makeBtn, makeMenuOption } = require('../btnConfig');

async function buildSnap(account, image, db) {
    const embed = new EmbedBuilder()
        .setTitle('👻 سناب شات')
        .setColor(0xFFFC00)
        .setDescription('أرسل سنابات وتواصل مع أصدقائك.')
        .setFooter({ text: 'سناب شات • بوت FANTASY' })
        .setTimestamp();
    if (image) embed.setImage(image);

    if (!account) {
        const c = await loadSystemBtns(db, 'snap');
        const row = new ActionRowBuilder().addComponents(
            makeBtn('snap_create', c.create),
        );
        return { embeds: [embed], components: [row, resetRow('سناب')] };
    }

    const mc = await loadSystemBtns(db, 'snap_menu');
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('snap_menu')
            .setPlaceholder('👻 اختر من القائمة')
            .addOptions([
                makeMenuOption('snap_send',     mc.send),
                makeMenuOption('snap_inbox',    mc.inbox),
                makeMenuOption('snap_friends',  mc.friends),
                makeMenuOption('snap_add',      mc.add),
                makeMenuOption('snap_requests', mc.requests),
            ])
    );

    return { embeds: [embed], components: [menu, resetRow('سناب')] };
}

module.exports = {
    name: 'سناب',
    data: new SlashCommandBuilder().setName('سناب').setDescription('سناب شات — الرسائل والأصدقاء'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const account = await db.getSnapAccount(message.author.id);
        const img = await db.getImage('سناب شات');
        message.channel.send(await buildSnap(account, img, db));
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const account = await db.getSnapAccount(interaction.user.id);
        const img = await db.getImage('سناب شات');
        await interaction.channel.send(await buildSnap(account, img, db));
        await interaction.reply({ content: '​', flags: 64 });
    },
    buildSnap,
};
