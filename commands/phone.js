const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, StringSelectMenuBuilder,
} = require('discord.js');
const { resetRow } = require('../utils');
const db = require('../database');

async function build() {
    const img = await db.getImage('phone');

    const embed = new EmbedBuilder()
        .setTitle('Phone')
        .setColor(0x1565C0)
        .setDescription('> Choose the service you want from the menu below')
        .setFooter({ text: 'Phone System • FANTASY Bot' })
        .setTimestamp();

    if (img) embed.setImage(img);

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('phone_menu')
            .setPlaceholder('📱 Choose a service')
            .addOptions([
                {
                    label: '🚨 Police Report',
                    value: 'report_police',
                    description: 'Send a report to the police team',
                },
                {
                    label: '🚑 Ambulance Report',
                    value: 'report_ambulance',
                    description: 'Send a report to the ambulance team',
                },
            ])
    );

    return { embeds: [embed], components: [menu, resetRow('phone')] };
}

module.exports = {
    name: 'phone',
    data: new SlashCommandBuilder().setName('phone').setDescription('📱 Phone'),

    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        message.channel.send(await build());
    },

    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const main = await build();
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.reply({ content: '​', flags: 64 });
    },
};
