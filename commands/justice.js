const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow, resetOption, isAdmin } = require('../utils');
const { loadEmbedCfg, applyEmbed } = require('../embedConfig');

module.exports = {
    name: 'عدل',
    data: new SlashCommandBuilder().setName('عدل').setDescription('🏛️ Justice System — Case Management'),

    async execute(message, args, db) {
        if (!(await isAdmin(message.member, db))) return message.reply('❌ This command is for admins only.');
        message.channel.send(await build(db));
    },

    async slashExecute(interaction, db) {
        const main = await build(db);
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.deferReply({ flags: 64 }).catch(() => {});
        await interaction.deleteReply().catch(() => {});
    },
};

async function build(db) {
    const img = await db.getImage('عدل');
    const cfg = await loadEmbedCfg(db, 'justice');
    const embed = new EmbedBuilder().setColor(0xE53935).setTimestamp();
    applyEmbed(embed, cfg);
    if (img) embed.setImage(img);

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('justice_menu')
            .setPlaceholder(cfg.placeholder || '🏛️ Choose an action')
            .addOptions([
                { label: '✅ Accept Case',       value: 'accept_case',   description: 'Accept a pending case' },
                { label: '❌ Reject Case',        value: 'reject_case',   description: 'Reject a case with reason' },
                { label: '👨‍⚖️ Assign Judge',   value: 'assign_judge',  description: 'Assign a judge to an accepted case' },
                { label: '📜 Issue Verdict',       value: 'issue_verdict', description: 'Issue the final verdict for an ongoing case' },
            
                resetOption('عدل'),
            ])
    );
    return { embeds: [embed], components: [menu] };
}
