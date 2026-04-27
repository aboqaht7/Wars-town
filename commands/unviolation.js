module.exports = {
    name: 'فك-مخالف',
    async execute(message, args, db) {
        const { isAdmin } = require('../utils');
        const permRoleId = await db.getConfig('ban_role_id');
        const authorized = permRoleId
            ? message.member.roles.cache.has(permRoleId)
            : message.member.roles.cache.some(r => r.name === 'مبرمج') || await isAdmin(message.member, db);
        if (!authorized)
            return message.reply('❌ You do not have permission to lift violations.');

        const target = message.mentions.members?.first()
            || message.guild?.members.cache.get(args[0]);
        if (!target)
            return message.reply('❌ Usage: `-فك-مخالف @player`');

        const violation = await db.getViolationByUserId(target.id);

        const rolesToRestore = new Set();

        if (violation?.saved_roles) {
            try {
                const saved = JSON.parse(violation.saved_roles);
                saved.forEach(id => rolesToRestore.add(id));
            } catch (_) {}
        }

        const activationRoleId = await db.getConfig('activation_role_id');
        const identityRoleId   = await db.getConfig('identity_role');
        if (activationRoleId) rolesToRestore.add(activationRoleId);
        if (identityRoleId)   rolesToRestore.add(identityRoleId);

        const banRoleId = await db.getConfig('violation_role_id');
        if (banRoleId) rolesToRestore.delete(banRoleId);

        for (const roleId of rolesToRestore) {
            const role = message.guild.roles.cache.get(roleId);
            if (role) await target.roles.add(role).catch(() => {});
        }

        if (banRoleId) {
            const banRole = message.guild.roles.cache.get(banRoleId);
            if (banRole) await target.roles.remove(banRole).catch(() => {});
        }

        await db.removeViolation(target.id);

        await message.channel.send(
            `✅ **Violation lifted for ${target} — all roles restored**\n> **By:** ${message.author}`
        );

        try {
            await target.send(
                `✅ **Your violation in ${message.guild.name} has been lifted**\n` +
                `> All your previous roles have been fully restored.`
            );
        } catch (_) {}
    }
};
