const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const OPTIONS = [
    { label: '🪪 الهوية', value: 'identity' },
    { label: '📱 Phone', value: 'phone' },
    { label: '💬 Messages', value: 'sms' },
    { label: '𝕏 X Platform', value: 'x_platform' },
    { label: '🎒 Bag', value: 'bag' },
    { label: '🏦 Bank', value: 'bank' },
    { label: '✈️ Trips & Events', value: 'events' },
    { label: '💼 Jobs & Markets', value: 'jobs' },
    { label: '🛒 Tools Market', value: 'market' },
    { label: '⚖️ Law', value: 'law' },
    { label: '🛡️ Admin', value: 'admin' },
    { label: '🔫 Crimes', value: 'crime' },
    { label: '🎫 Tickets', value: 'tickets' },
    { label: '🚗 Cars & Showroom', value: 'vehicles' },
    { label: '🔄 Reset Menu', value: 'reset_help', description: 'Return to the main view' },
];

module.exports = {
    name: 'help',
    data: new SlashCommandBuilder().setName('help').setDescription('View the bot systems menu'),
    async execute(message, args, db) {
        message.channel.send(await build(db));
    },
    async slashExecute(interaction, db) {
        const main = await build(db);
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.reply({ content: '​', flags: 64 });
    }
};

async function build(db) {
    const _img = await db.getImage('admin').catch(() => null);

    const embed = new EmbedBuilder()
        .setTitle('FANTASY Bot — Systems Menu')
        .setColor(0xE53935)
        .setDescription('Choose a system from the menu below to view its details.')
        .setFooter({ text: 'FANTASY Bot • Comprehensive RP System' })
        .setTimestamp();
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('help_menu')
            .setPlaceholder('Choose a system for details')
            .addOptions(OPTIONS)
    );
    if (_img) embed.setImage(_img);
    return { embeds: [embed], components: [menu] };
}
