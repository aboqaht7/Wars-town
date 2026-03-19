const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

const COOLDOWN_SECONDS = 10;
const COOLDOWN_MINUTES = COOLDOWN_SECONDS / 60;

module.exports = {
    name: 'jobs',
    data: new SlashCommandBuilder().setName('jobs').setDescription('💼 الوظائف الحرة'),
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
        .setTitle('💼 الوظائف الحرة')
        .setColor(0xF57F17)
        .setDescription('> اختر وظيفتك من القائمة أدناه')
        .setFooter({ text: `نظام الوظائف • بوت FANTASY • كولداون ${COOLDOWN_SECONDS} ثوان بين كل وظيفة` })
        .setTimestamp();
    if (img) embed.setImage(img);

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('jobs_menu')
            .setPlaceholder('اختر وظيفتك')
            .addOptions([
                { label: '🎣 صيد السمك',      value: 'fishing',     description: 'يتطلب: سنارة' },
                { label: '🪓 تقطيع الخشب',    value: 'woodcutting', description: 'يتطلب: فأس' },
                { label: '⛏️ المنجم',          value: 'mining',      description: 'يتطلب: أدوات المنجم' },
            ])
    );

    return { embeds: [embed], components: [menu, resetRow('jobs')] };
}
