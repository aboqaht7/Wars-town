const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow, resetOption } = require('../utils');

module.exports = {
    name: 'معارض',
    data: new SlashCommandBuilder().setName('معارض').setDescription('View showroom — cars available for sale'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const err = await db.checkLoginAndIdentity(message.author.id);
        if (err) return message.reply(err);
        const cars = await db.getShowroom();
        const img = await db.getImage('showroom');
        const { embed, components } = build(cars, img);
        message.channel.send({ embeds: [embed], components });
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const err = await db.checkLoginAndIdentity(interaction.user.id);
        if (err) return interaction.reply({ content: err, flags: 64 });
        const cars = await db.getShowroom();
        const img = await db.getImage('showroom');
        const { embed, components } = build(cars, img);
        await interaction.channel.send({ embeds: [embed], components });
        await interaction.reply({ content: '​', flags: 64 });
    }
};

function build(cars, image) {
    const embed = new EmbedBuilder()
        .setTitle('Car Showroom')
        .setColor(0xB71C1C)
        .setDescription(cars.length
            ? `**${cars.length}** cars available — choose from the menu to view details.`
            : '> No cars available in the showroom right now')
        .setFooter({ text: 'Showroom System • FANTASY Bot' })
        .setTimestamp();
    if (image) embed.setImage(image);

    const components = cars.length ? [] : [resetRow('showroom')];
    if (cars.length) {
        const options = cars.slice(0, 24).map(c => ({
            label: `🚗 ${c.car_name}`,
            value: `car_${c.id}`,
            description: `${Number(c.price).toLocaleString()} Riyals${c.color ? ` • ${c.color}` : ''}`,
        }));
        options.push(resetOption('showroom'));
        components.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('showroom_menu')
                .setPlaceholder('Choose a car to inquire about')
                .addOptions(options)
        ));
    }
    return { embed, components };
}
