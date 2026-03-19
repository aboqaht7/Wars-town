const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'GMC',

    async execute(message, args, db) {
        await db.addStaffActivity(message.author.id, 'gmc_count');

        const embed = new EmbedBuilder()
            .setColor(0x1565C0)
            .setDescription(`✅ احسنت <@${message.author.id}>!\nتمت إضافة **8 نقاط** للرقابة.`)
            .setFooter({ text: 'نظام نقاط الإدارة • بوت FANTASY' })
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });
        message.delete().catch(() => {});
    }
};
