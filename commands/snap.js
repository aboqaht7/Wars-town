const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, StringSelectMenuBuilder,
} = require('discord.js');
const { resetRow, resetOption } = require('../utils');
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
            
                { label: '🔄 Reset Menu', value: 'reset_سناب', description: 'Return to the main view' },
            ])
    );

    return { embeds: [embed], components: [menu] };
}

module.exports = {
    name: 'سناب',
    data: new SlashCommandBuilder().setName('سناب').setDescription('Snapchat — Messages and Friends'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const account = await db.getSnapAccount(message.author.id);
        const img = await db.getImage('Snapchat');
        message.channel.send(await buildSnap(account, img, db));
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const account = await db.getSnapAccount(interaction.user.id);
        const img = await db.getImage('Snapchat');
        await interaction.channel.send(await buildSnap(account, img, db));
        await interaction.reply({ content: '​', flags: 64 });
    },
    buildSnap,
};
