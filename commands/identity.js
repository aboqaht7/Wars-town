const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, StringSelectMenuBuilder
} = require('discord.js');
const { resetRow, resetOption } = require('../utils');

module.exports = {
    name: 'identity',
    data: new SlashCommandBuilder()
        .setName('identity')
        .setDescription('Identity System'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const { embed, menu } = await buildMain(message.author.id, db);
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const { embed, menu } = await buildMain(interaction.user.id, db);
        const main = { embeds: [embed], components: [menu] };
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.deferReply({ flags: 64 }).catch(() => {});
        await interaction.deleteReply().catch(() => {});
    }
};

const SLOT_NAMES = { 1: 'Character 1', 2: 'Character 2', 3: 'Character 3' };

async function buildMain(userId, db) {
    const { loadEmbedCfg, applyEmbed } = require('../embedConfig');
    const img = await db.getImage('identity');
    const cfg = await loadEmbedCfg(db, 'identity');
    const embed = new EmbedBuilder().setColor(0xE53935).setTimestamp();
    applyEmbed(embed, cfg);
    if (img) embed.setImage(img);

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('identity_menu')
            .setPlaceholder(cfg.placeholder || 'Choose an option')
            .addOptions([
                { label: '✏️ Create Identity', value: 'create_identity', description: 'Create a new character in an empty slot' },
                { label: '✅ Login', value: 'login_identity', description: 'Login with an existing character' },
                { label: '🚪 Logout', value: 'logout_identity', description: 'Logout from the current character' },
            
                resetOption('identity'),
            ])
    );
    return { embed, menu };
}

module.exports.buildMain = buildMain;
