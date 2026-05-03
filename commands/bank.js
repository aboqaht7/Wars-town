const {
    EmbedBuilder,
    ActionRowBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const { resetRow } = require('../utils');
const { loadSystemBtns, makeBtn } = require('../btnConfig');

async function bankMenu(imageUrl, db) {
    const c = await loadSystemBtns(db, 'bank');
    const row = new ActionRowBuilder().addComponents(
        makeBtn('bank_balance',  c.balance),
        makeBtn('bank_deposit',  c.deposit),
        makeBtn('bank_withdraw', c.withdraw),
        makeBtn('bank_transfer', c.transfer),
    );
    const { loadEmbedCfg, applyEmbed } = require('../embedConfig');
    const cfg = await loadEmbedCfg(db, 'bank');
    const embed = new EmbedBuilder().setColor(0xE53935).setTimestamp();
    applyEmbed(embed, cfg);
    if (imageUrl) embed.setImage(imageUrl);
    return { embeds: [embed], components: [row] };
}

module.exports = {
    name: 'بنك',
    data: new SlashCommandBuilder()
        .setName('بنك')
        .setDescription('Open the bank menu'),

    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const img = await db.getImage('bank');
        message.channel.send(await bankMenu(img, db));
    },

    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const img = await db.getImage('bank');
        const main = await bankMenu(img, db);
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.deferReply({ flags: 64 }).catch(() => {});
        await interaction.deleteReply().catch(() => {});
    },

    bankMenu,
};
