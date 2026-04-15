const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'حذف-تغريدة',
    async execute(message, args, db) {
        const id = parseInt(args[0]);
        if (!id) return message.reply('❌ استخدم: `-حذف-تغريدة [رقم المنشور]`');
        const deleted = await db.deletePost(id, message.author.id);
        if (!deleted) return message.reply('❌ لم يتم العثور على المنشور أو ليس لديك صلاحية حذفه.');
        const _img = await db.getImage('x_platform').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('Tweet Deleted')
            .setColor(0x000000)
            .addFields({ name: '🆔 رقم المنشور', value: `\`#${id}\``, inline: true })
            .setFooter({ text: 'X Platform • FANTASY Bot' })
            .setTimestamp();
        if (_img) embed.setImage(_img);
        message.channel.send({ embeds: [embed] });
    }
};
