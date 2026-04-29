const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetOption } = require('../utils');
const { loadSystemBtns, makeMenuOption } = require('../btnConfig');

const COOLDOWN_SECONDS = 10;
const COOLDOWN_MINUTES = COOLDOWN_SECONDS / 60;

async function buildJobs(db) {
    const img = await db.getImage('jobs').catch(() => null);
    const embed = new EmbedBuilder()
        .setTitle('Free Jobs')
        .setColor(0xF57F17)
        .setDescription('> اختر وظيفتك من القائمة أدناه')
        .setFooter({ text: `Jobs System • FANTASY Bot • ${COOLDOWN_SECONDS}s cooldown` })
        .setTimestamp();
    if (img) embed.setImage(img);

    const mc = await loadSystemBtns(db, 'jobs_menu');
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('jobs_menu')
            .setPlaceholder('اختر وظيفتك')
            .addOptions([
                makeMenuOption('fishing',     mc.fishing),
                makeMenuOption('woodcutting', mc.woodcutting),
                makeMenuOption('mining',      mc.mining),
                resetOption('jobs'),
            ])
    );
    return { embeds: [embed], components: [menu] };
}

module.exports = {
    name: 'jobs',
    data: new SlashCommandBuilder().setName('jobs').setDescription('💼 Free Jobs'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        message.channel.send(await buildJobs(db));
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
