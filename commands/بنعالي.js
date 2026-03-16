module.exports = {
    name: 'بنعالي',
    async execute(message, args, db) {
        const { isAdmin } = require('../utils');
        if (!(await isAdmin(message.member, db)))
            return message.reply('❌ هذا الأمر للإدارة فقط.');
        const target = message.mentions.members?.first() || message.guild?.members.cache.get(args[0]);
        if (!target) return message.reply('❌ حدد اللاعب المراد طرده. مثال: `-بنعالي @اللاعب`');
        if (!target.bannable) return message.reply('❌ لا أستطيع طرد هذا اللاعب.');
        const username = target.user.username;
        await target.ban({ reason: `تشهير نهائي — بواسطة ${message.author.username}`, deleteMessageSeconds: 0 });
        await message.channel.send(`🚫 تم طرد الحثالة **${username}** من السيرفر نهائياً.`);
    }
};
