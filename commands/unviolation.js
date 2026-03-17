module.exports = {
    name: 'فك-مخالف',
    async execute(message, args, db) {
        const { isAdmin } = require('../utils');
        const permRoleId = await db.getConfig('ban_role_id');
        const authorized = permRoleId
            ? message.member.roles.cache.has(permRoleId)
            : message.member.roles.cache.some(r => r.name === 'مبرمج') || await isAdmin(message.member, db);
        if (!authorized)
            return message.reply('❌ ليس لديك صلاحية تنفيذ أوامر الباند.');

        const target = message.mentions.members?.first()
            || message.guild?.members.cache.get(args[0]);
        if (!target)
            return message.reply('❌ استخدم: `-فك-مخالف @اللاعب`');

        const violation = await db.getViolationByUserId(target.id);

        // جمع الرتب المراد إعادتها
        const rolesToRestore = new Set();

        if (violation?.saved_roles) {
            try {
                const saved = JSON.parse(violation.saved_roles);
                saved.forEach(id => rolesToRestore.add(id));
            } catch (_) {}
        }

        // رتبة التفعيل ورتبة الهوية دائماً
        const activationRoleId = await db.getConfig('activation_role_id');
        const identityRoleId   = await db.getConfig('identity_role');
        if (activationRoleId) rolesToRestore.add(activationRoleId);
        if (identityRoleId)   rolesToRestore.add(identityRoleId);

        // رتبة الباند — نحذفها من القائمة إن وُجدت
        const banRoleId = await db.getConfig('violation_role_id');
        if (banRoleId) rolesToRestore.delete(banRoleId);

        // تطبيق الرتب
        for (const roleId of rolesToRestore) {
            const role = message.guild.roles.cache.get(roleId);
            if (role) await target.roles.add(role).catch(() => {});
        }

        // إزالة رتبة الباند
        if (banRoleId) {
            const banRole = message.guild.roles.cache.get(banRoleId);
            if (banRole) await target.roles.remove(banRole).catch(() => {});
        }

        await db.removeViolation(target.id);

        await message.channel.send(
            `✅ **تم فك المخالفة عن ${target} وتمت استعادة جميع رتبه**\n> **المنفذ:** ${message.author}`
        );

        try {
            await target.send(
                `✅ **تم رفع المخالفة عنك في سيرفر ${message.guild.name}**\n` +
                `> تمت استعادة جميع رتبك السابقة بالكامل.`
            );
        } catch (_) {}
    }
};
