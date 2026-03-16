module.exports = {
    name: 'بنعال-الشريف',
    async execute(message, args, db) {
        const { isAdmin } = require('../utils');
        const isMubarmij = message.member.roles.cache.some(r => r.name === 'مبرمج');
        if (!isMubarmij && !(await isAdmin(message.member, db)))
            return message.reply('❌ هذا الأمر للإدارة فقط.');
        const target = message.mentions.members?.first() || message.guild?.members.cache.get(args[0]);
        if (!target) return message.reply('❌ حدد اللاعب المراد طرده. مثال: `-بنعال-الشريف @اللاعب`');
        const username = target.user.username;
        await target.ban({ reason: `تشهير نهائي — بواسطة ${message.author.username}`, deleteMessageSeconds: 0 });
        await message.channel.send(`🚫 تم طرد الحثالة **${username}** من السيرفر نهائياً.`);
    }
};
