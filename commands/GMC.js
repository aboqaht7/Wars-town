const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'GMC',

    async execute(message, args, db) {
        await db.addStaffActivity(message.author.id, 'gmc_count');

        const embed = new EmbedBuilder()
            .setColor(0xE53935)
            .setDescription(`✅ Well done <@${message.author.id}>!\n**8 points** added for supervision.`)
            .setFooter({ text: 'Admin Points System • FANTASY Bot' })
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });
        message.delete().catch(() => {});
    }
};
