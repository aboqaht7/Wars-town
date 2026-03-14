const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'حذف-تغريدة',
    async execute(message, args, db) {
        const id = parseInt(args[0]);
        if (!id) return message.reply('❌ استخدم: `-حذف-تغريدة [رقم المنشور]`');
        const deleted = await db.deletePost(id, message.author.id);
        if (!deleted) return message.reply('❌ لم يتم العثور على المنشور أو ليس لديك صلاحية حذفه.');
        const embed = new EmbedBuilder()
            .setTitle('🗑️ تم حذف التغريدة')
            .setColor(0x000000)
            .addFields({ name: '🆔 رقم المنشور', value: `\`#${id}\``, inline: true })
            .setFooter({ text: 'منصة X • بوت FANTASY' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
};
