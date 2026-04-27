const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'help-band',
    data: new SlashCommandBuilder()
        .setName('help-band')
        .setDescription('List of defamation and permanent-ban commands'),

    async slashExecute(interaction, db) {
        await interaction.reply({ content: '⏳', flags: 64 });

        const text = [
            '**🚫 Defamation Commands — Permanent Server Ban**',
            '',
            '`-بنعالي @player`',
            '`-شقلب @player`',
            '`-تفوو @player`',
            '`-بنعال-ابو-قحط @player`',
            '`-بنعال-عسيري @player`',
            '`-بنعال-الشريف @player`',
            '`-بنعال-مشاري @player`',
            '',
            '> All commands are admin-only — the player is permanently banned from the server upon execution.',
        ].join('\n');

        await interaction.channel.send(text);
    }
};
