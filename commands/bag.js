const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder,
} = require('discord.js');
const { resetRow } = require('../utils');
const { loadSystemBtns, makeBtn } = require('../btnConfig');
const { loadEmbedCfg, applyEmbed } = require('../embedConfig');

async function build(image, db) {
    const c = await loadSystemBtns(db, 'bag');
    const cfg = await loadEmbedCfg(db, 'bag');
    const embed = new EmbedBuilder().setColor(0xE65100).setTimestamp();
    applyEmbed(embed, cfg);
    if (image) embed.setImage(image);

    const row = new ActionRowBuilder().addComponents(
        makeBtn('bag_view',     c.view),
        makeBtn('bag_use',      c.use),
        makeBtn('bag_transfer', c.transfer),
    );

    return { embeds: [embed], components: [row] };
}

module.exports = {
    name: 'bag',
    data: new SlashCommandBuilder().setName('bag').setDescription('View bag and items'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const img = await db.getImage('bag');
        message.channel.send(await build(img, db));
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const img = await db.getImage('bag');
        const main = await build(img, db);
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.deferReply({ flags: 64 }).catch(() => {});
        await interaction.deleteReply().catch(() => {});
    }
};
