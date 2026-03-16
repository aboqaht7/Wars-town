module.exports = {
    name: 'فك-مخالف',
    async execute(message, args, db) {
        const { isAdmin } = require('../utils');
        if (!(await isAdmin(message.member, db)))
            return message.reply('❌ هذا الأمر للإدارة فقط.');

        const target = message.mentions.members?.first()
            || message.guild?.members.cache.get(args[0]);
        if (!target)
            return message.reply('❌ استخدم: `-فك-مخالف @اللاعب`');

        const roleId = await db.getConfig('violation_role_id');
        if (!roleId)
            return message.reply('❌ لم يتم تعيين رتبة المبند.');

        const role = message.guild.roles.cache.get(roleId);
        if (role) await target.roles.remove(role).catch(() => {});

        await db.removeViolation(target.id);

        await message.channel.send(
            `✅ **تم فك المخالفة عن ${target}**\n> **المنفذ:** ${message.author}`
        );

        try {
            await target.send(
                `✅ **تم رفع المخالفة عنك في سيرفر ${message.guild.name}**\n` +
                `> تمت استعادة وصولك الكامل.`
            );
        } catch (_) {}
    }
};
