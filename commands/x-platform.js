const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder,
} = require('discord.js');
const { resetRow } = require('../utils');
const { loadSystemBtns, makeBtn } = require('../btnConfig');

async function build(image, account, db) {
    const c = await loadSystemBtns(db, 'x');
    const embed = new EmbedBuilder()
        .setTitle('𝕏 Platform')
        .setColor(0x000000)
        .setDescription(account
            ? `Welcome **@${account.x_username}** — choose what you want to do.`
            : 'Create your X platform account and start tweeting.')
        .setFooter({ text: 'X Platform • FANTASY Bot' })
        .setTimestamp();
    if (image) embed.setImage(image);

    const row = new ActionRowBuilder().addComponents(
        makeBtn('x_create_account', c.create),
        makeBtn('x_send_tweet',     c.tweet),
        makeBtn('x_delete_account', c.delete),
    );

    return { embeds: [embed], components: [row] };
}

module.exports = {
    name: 'منصة-x',
    data: new SlashCommandBuilder().setName('منصة-x').setDescription('𝕏 Platform'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const img = await db.getImage('x_platform');
        const account = await db.getXAccount(message.author.id);
        message.channel.send(await build(img, account, db));
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const img = await db.getImage('x_platform');
        const account = await db.getXAccount(interaction.user.id);
        await interaction.channel.send(await build(img, account, db));
        await interaction.deferReply({ flags: 64 }).catch(() => {});
        await interaction.deleteReply().catch(() => {});
    }
};
