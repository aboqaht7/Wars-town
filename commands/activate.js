const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

module.exports = {
    name: 'تفعيل',
    data: new SlashCommandBuilder()
        .setName('تفعيل')
        .setDescription('Send account activation panel'),

    async slashExecute(interaction, db) {
        const _img = await db.getImage('identity').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('Account Activation System')
            .setColor(0xE53935)
            .setDescription(
                '**Welcome to the Activation System!**\n\n' +
                'To activate your account in the server, follow these steps:\n\n' +
                '**1️⃣** Choose **Activate** from the menu below\n' +
                '**2️⃣** Enter your **PlayStation ID (PSN)**\n' +
                '**3️⃣** Wait for admin approval\n\n' +
                '> ⚠️ Make sure to enter the ID correctly'
            )
            .setFooter({ text: 'Activation System • FANTASY Bot' })
            .setTimestamp();

        const menu = new StringSelectMenuBuilder()
            .setCustomId('activation_menu')
            .setPlaceholder('Select here...')
            .addOptions({ label: '🎮 Activate', description: 'Enter your PlayStation ID to activate', value: 'activate_now' });

        const resetBtn = new ButtonBuilder()
            .setCustomId('reset_menu')
            .setLabel('Reset Menu').setEmoji({ id: '1479212270746599528', name: 'GL137', animated: true })
            .setStyle(ButtonStyle.Secondary);

        const main = {
            embeds: [embed],
            components: [
                new ActionRowBuilder().addComponents(menu),
                new ActionRowBuilder().addComponents(resetBtn),
            ],
        };

        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        return interaction.reply({ content: '​', flags: 64 });
    },
};
