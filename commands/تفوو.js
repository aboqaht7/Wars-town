module.exports = {
    name: 'تفوو',
    async execute(message, args, db) {
        const { isAdmin } = require('../utils');
        const banRoleId = await db.getConfig('ban_role_id');
        const authorized = banRoleId
            ? message.member.roles.cache.has(banRoleId)
            : message.member.roles.cache.some(r => r.name === 'مبرمج') || await isAdmin(message.member, db);
        if (!authorized)
            return message.reply('❌ ليس لديك صلاحية تنفيذ أوامر الباند.');
        const mentionId = message.mentions.users.first()?.id || args[0]?.replace(/\D/g, '');
        if (!mentionId) return message.reply('❌ حدد اللاعب المراد طرده. مثال: `-تفوو @اللاعب`');
        let target;
        try { target = await message.guild.members.fetch(mentionId); } catch { target = null; }
        if (!target) return message.reply('❌ اللاعب غير موجود في السيرفر.');
        const username = target.user.username;
        await target.ban({ reason: `تشهير نهائي — بواسطة ${message.author.username}`, deleteMessageSeconds: 0 });
        await message.channel.send(`🚫 تم طرد الحثالة **${username}** من السيرفر نهائياً.`);
    }
};
