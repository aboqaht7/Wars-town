module.exports = {
    name: 'شقلب',
    async execute(message, args, db) {
        const { isAdmin } = require('../utils');
        const { logEvent } = require('../loggers');
        const { EmbedBuilder } = require('discord.js');

        const banRoleId = await db.getConfig('ban_role_id');
        const authorized = banRoleId
            ? message.member.roles.cache.has(banRoleId)
            : message.member.roles.cache.some(r => r.name === 'مبرمج') || await isAdmin(message.member, db);
        if (!authorized)
            return message.reply('ليس لديك صلاحية لتنفيذ أوامر الباند.');

        const target = message.mentions.members?.first() || message.guild?.members.cache.get(args[0]);
        if (!target) return message.reply('حدد اللاعب المراد بانده. مثال: `-شقلب @لاعب`');

        const username = target.user.username;
        await target.ban({ reason: `طرد نهائي — بواسطة ${message.author.username}`, deleteMessageSeconds: 0 });
        await message.channel.send(`تم طرد اللاعب **${username}** نهائياً من السيرفر.`);

        const embed = new EmbedBuilder()
            .setTitle('طرد نهائي (شقلب)')
            .setColor(0xB71C1C)
            .addFields(
                { name: 'المنفذ', value: `${message.author}`, inline: true },
                { name: 'اللاعب', value: `${username} (\`${target.id}\`)`, inline: true },
                { name: 'القناة', value: `<#${message.channel.id}>`, inline: true },
            )
            .setFooter({ text: 'نظام الباند • FANTASY Bot' })
            .setTimestamp();
        logEvent(message.client, db, 'band', embed);
    }
};
