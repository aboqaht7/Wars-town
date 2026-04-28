const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow, resetOption } = require('../utils');

const COOLDOWN_SECONDS = 10;
const COOLDOWN_MINUTES = COOLDOWN_SECONDS / 60;

module.exports = {
    name: 'jobs',
    data: new SlashCommandBuilder().setName('jobs').setDescription('💼 Free Jobs'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const payload = await buildJobs(db);
        message.channel.send(payload);
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const payload = await buildJobs(db);
        if (interaction._isReset) return interaction.message.edit(payload);
        await interaction.channel.send(payload);
        await interaction.reply({ content: '​', flags: 64 });
    },
    buildJobs,
    COOLDOWN_MINUTES,
};

async function buildJobs(db) {
    const img = await db.getImage('jobs');

    const embed = new EmbedBuilder()
        .setTitle('Free Jobs')
        .setColor(0xF57F17)
        .setDescription('> Choose your job from the menu below')
        .setFooter({ text: `Jobs System • FANTASY Bot • ${COOLDOWN_SECONDS}s cooldown between jobs` })
        .setTimestamp();
    if (img) embed.setImage(img);

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('jobs_menu')
            .setPlaceholder('Choose your job')
            .addOptions([
                { label: '🎣 Fishing',      value: 'fishing',     description: 'Requires: Fishing Rod' },
                { label: '🪓 Woodcutting',    value: 'woodcutting', description: 'Requires: Axe' },
                { label: '⛏️ Mining',          value: 'mining',      description: 'Requires: Mining Tools' },
            
                resetOption('jobs'),
            ])
    );

    return { embeds: [embed], components: [menu] };
}
