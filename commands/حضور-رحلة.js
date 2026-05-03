const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'حضور-رحلة',

    async execute(message, args, db) {
        await db.addStaffManualPoints(message.author.id, 3);

        const embed = new EmbedBuilder()
            .setColor(0xE53935)
            .setDescription(`✅ Well done <@${message.author.id}>!\n**3 points** have been added for attending the trip.`)
            .setFooter({ text: 'Admin Points System • FANTASY Bot' })
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });
        message.delete().catch(() => {});
    }
};
