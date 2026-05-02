module.exports = {
    name: 'فك-باند',
    async execute(message, args, db) {
        const { isAdmin } = require('../utils');

        // ── صلاحيات ──────────────────────────────────────────────────────
        const permRoleId = await db.getConfig('ban_role_id');
        const authorized = permRoleId
            ? message.member.roles.cache.has(permRoleId)
            : await isAdmin(message.member, db);
        if (!authorized)
            return message.reply('ليس لديك صلاحية لفك الباند.');

        // ── تحديد اللاعب ─────────────────────────────────────────────────
        const target = message.mentions.members?.first()
            || message.guild?.members.cache.get(args[0]);
        if (!target)
            return message.reply('الاستخدام: `-فك-باند @لاعب` أو `-فك-باند [ID]`');

        // ── جلب سجل الباند من قاعدة البيانات ────────────────────────────
        const band = await db.getBandByUserId(target.id);

        // ── رتبة الباند ───────────────────────────────────────────────────
        const bandRoleId = await db.getConfig('violation_role_id');

        // ── إزالة رتبة الباند ────────────────────────────────────────────
        if (bandRoleId) {
            const bandRole = message.guild.roles.cache.get(bandRoleId);
            if (bandRole) await target.roles.remove(bandRole).catch(() => {});
        }

        // ── إعادة الرتب المحفوظة ─────────────────────────────────────────
        let restoredCount = 0;
        if (band?.saved_roles) {
            try {
                const saved = JSON.parse(band.saved_roles);
                for (const roleId of saved) {
                    if (roleId === bandRoleId) continue;
                    const role = message.guild.roles.cache.get(roleId);
                    if (role) {
                        await target.roles.add(role).catch(() => {});
                        restoredCount++;
                    }
                }
            } catch (_) {}
        }

        // ── حذف السجل من قاعدة البيانات ──────────────────────────────────
        await db.removeBand(target.id);

        // ── الرد في القناة ────────────────────────────────────────────────
        await message.channel.send(
            `تم فك الباند عن ${target} وأُعيدت جميع رتبه (${restoredCount} رتبة)\n` +
            `> **بواسطة:** ${message.author}`
        );

        // ── إشعار اللاعب ──────────────────────────────────────────────────
        try {
            await target.send(
                `تم رفع الباند عنك في سيرفر **${message.guild.name}** — أُعيدت جميع رتبك.`
            );
        } catch (_) {}
    }
};
