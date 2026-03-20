const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'حضور-رحلة',

    async execute(message, args, db) {
        await db.addStaffManualPoints(message.author.id, 3);

        const embed = new EmbedBuilder()
            .setColor(0x2E7D32)
            .setDescription(`✅ احسنت <@${message.author.id}>!\nتمت إضافة **3 نقاط** لحضور الرحلة.`)
            .setFooter({ text: 'نظام نقاط الإدارة • بوت FANTASY' })
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });
        message.delete().catch(() => {});
    }
};
