const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow, isAdmin } = require('../utils');

module.exports = {
    name: 'عدل',
    data: new SlashCommandBuilder().setName('عدل').setDescription('🏛️ Justice System — Case Management'),

    async execute(message, args, db) {
        if (!(await isAdmin(message.member, db))) return message.reply('❌ هذا الأمر للإدارة فقط.');
        message.channel.send(await build(db));
    },

    async slashExecute(interaction, db) {
        const main = await build(db);
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.reply({ content: '​', flags: 64 });
    },
};

async function build(db) {
    const img = await db.getImage('عدل');
    const embed = new EmbedBuilder()
        .setTitle('Justice System')
        .setColor(0x4A148C)
        .setDescription('> Manage filed cases — choose an action from the menu')
        .setFooter({ text: 'Justice System • FANTASY Bot' })
        .setTimestamp();
    if (img) embed.setImage(img);

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('justice_menu')
            .setPlaceholder('🏛️ Choose an action')
            .addOptions([
                { label: '✅ Accept Case',       value: 'accept_case',   description: 'Accept a pending case' },
                { label: '❌ Reject Case',        value: 'reject_case',   description: 'Reject a case with reason' },
                { label: '👨‍⚖️ Assign Judge',   value: 'assign_judge',  description: 'Assign a judge to an accepted case' },
                { label: '📜 Issue Verdict',       value: 'issue_verdict', description: 'Issue the final verdict for an ongoing case' },
            ])
    );
    return { embeds: [embed], components: [menu, resetRow('عدل')] };
}
