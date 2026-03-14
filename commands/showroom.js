const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'معارض',
    data: new SlashCommandBuilder()
        .setName('معارض')
        .setDescription('عرض المعرض — السيارات المتاحة للبيع'),
    async execute(message, args, db) {
        const cars = await db.getShowroom();
        const embed = buildEmbed(cars, await db.getImage('showroom'));
        const menu = buildMenu(cars);
        const components = menu ? [menu, resetRow('showroom')] : [resetRow('showroom')];
        message.channel.send({ embeds: [embed], components });
    },
    async slashExecute(interaction, db) {
        const cars = await db.getShowroom();
        const embed = buildEmbed(cars, await db.getImage('showroom'));
        const menu = buildMenu(cars);
        const components = menu ? [menu, resetRow('showroom')] : [resetRow('showroom')];
        interaction.reply({ embeds: [embed], components });
    }
};

function buildEmbed(cars, image) {
    const embed = new EmbedBuilder()
        .setTitle('🏎️ معرض السيارات')
        .setColor(0xB71C1C)
        .setImage(image || null)
        .setFooter({ text: 'نظام المعارض • بوت FANTASY' })
        .setTimestamp();
    if (!cars.length) {
        embed.setDescription('> لا توجد سيارات متاحة في المعرض حالياً');
        return embed;
    }
    embed.setDescription(`**${cars.length}** سيارة متوفرة في المعرض`);
    for (const car of cars) {
        const details = [
            car.car_type ? `النوع: ${car.car_type}` : null,
            car.color ? `اللون: ${car.color}` : null,
            `السعر: \`${Number(car.price).toLocaleString()} ريال\``,
        ].filter(Boolean).join(' • ');
        embed.addFields({ name: `🚗 ${car.car_name}`, value: details || 'لا توجد تفاصيل', inline: false });
    }
    return embed;
}

function buildMenu(cars) {
    if (!cars.length) return null;
    const options = cars.slice(0, 25).map(c => ({
        label: `🚗 ${c.car_name}`,
        value: `car_${c.id}`,
        description: `${Number(c.price).toLocaleString()} ريال${c.color ? ` • ${c.color}` : ''}`,
    }));
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('showroom_menu')
            .setPlaceholder('اختر سيارة للاستفسار')
            .addOptions(options)
    );
}
