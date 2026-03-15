const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'معارض',
    data: new SlashCommandBuilder().setName('معارض').setDescription('عرض المعرض — السيارات المتاحة للبيع'),
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
        .setTitle('🏎️ معرض السيارات')
        .setColor(0xB71C1C)
        .setDescription(cars.length
            ? `**${cars.length}** سيارة متوفرة — اختر من القائمة لعرض التفاصيل.`
            : '> لا توجد سيارات متاحة في المعرض حالياً')
        .setFooter({ text: 'نظام المعارض • بوت FANTASY' })
        .setTimestamp();
    if (image) embed.setImage(image);

    const components = [resetRow('showroom')];
    if (cars.length) {
        const options = cars.slice(0, 25).map(c => ({
            label: `🚗 ${c.car_name}`,
            value: `car_${c.id}`,
            description: `${Number(c.price).toLocaleString()} ريال${c.color ? ` • ${c.color}` : ''}`,
        }));
        components.unshift(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('showroom_menu')
                .setPlaceholder('اختر سيارة للاستفسار')
                .addOptions(options)
        ));
    }
    return { embed, components };
}
