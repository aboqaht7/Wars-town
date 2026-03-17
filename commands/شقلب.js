module.exports = {
    name: 'شقلب',
    async execute(message, args, db) {
        const { isAdmin } = require('../utils');
        const banRoleId = await db.getConfig('ban_role_id');
        const authorized = banRoleId
            ? message.member.roles.cache.has(banRoleId)
            : message.member.roles.cache.some(r => r.name === 'مبرمج') || await isAdmin(message.member, db);
        if (!authorized)
            return message.reply('❌ ليس لديك صلاحية تنفيذ أوامر الباند.');
        const target = message.mentions.members?.first() || message.guild?.members.cache.get(args[0]);
        if (!target) return message.reply('❌ حدد اللاعب المراد طرده. مثال: `-شقلب @اللاعب`');
        const username = target.user.username;
        await target.ban({ reason: `تشهير نهائي — بواسطة ${message.author.username}`, deleteMessageSeconds: 0 });
        await message.channel.send(`🚫 تم طرد الحثالة **${username}** من السيرفر نهائياً.`);
    }
};
