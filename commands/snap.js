const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, StringSelectMenuBuilder,
} = require('discord.js');
const { resetOption } = require('../utils');
const { loadSystemBtns, makeBtn, makeMenuOption } = require('../btnConfig');

async function buildSnap(account, image, db) {
    const embed = new EmbedBuilder()
        .setTitle('Snapchat')
        .setColor(0xFFFC00)
        .setDescription('Send snaps and connect with your friends.')
        .setFooter({ text: 'Snapchat • FANTASY Bot' })
        .setTimestamp();
    if (image) embed.setImage(image);

    if (!account) {
        const c = await loadSystemBtns(db, 'snap');
        const row = new ActionRowBuilder().addComponents(
            makeBtn('snap_create', c.create),
        );
        return { embeds: [embed], components: [row] };
    }

    const mc = await loadSystemBtns(db, 'snap_menu');
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('snap_menu')
            .setPlaceholder('👻 Choose from the menu')
            .addOptions([
                makeMenuOption('snap_send',     mc.send),
                makeMenuOption('snap_inbox',    mc.inbox),
                makeMenuOption('snap_friends',  mc.friends),
                makeMenuOption('snap_add',      mc.add),
                makeMenuOption('snap_requests', mc.requests),
                resetOption('سناب'),
            ])
    );

    return { embeds: [embed], components: [menu] };
}

module.exports = {
    name: 'سناب',
    data: new SlashCommandBuilder().setName('سناب').setDescription('Snapchat — Messages and Friends'),
    async execute(message, args, db) {
        const account = await db.getSnapAccount(message.author.id).catch(() => null);
        const img = await db.getImage('Snapchat').catch(() => null);
        message.channel.send(await buildSnap(account, img, db));
    },
    async slashExecute(interaction, db) {
        const account = await db.getSnapAccount(interaction.user.id).catch(() => null);
        const img = await db.getImage('Snapchat').catch(() => null);
        await interaction.channel.send(await buildSnap(account, img, db));
        await interaction.reply({ content: '​', flags: 64 });
    },
    buildSnap,
};
