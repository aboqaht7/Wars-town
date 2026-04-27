module.exports = {
    name: 'بنعال-عسيري',
    async execute(message, args, db) {
        const { isAdmin } = require('../utils');
        const banRoleId = await db.getConfig('ban_role_id');
        const authorized = banRoleId
            ? message.member.roles.cache.has(banRoleId)
            : message.member.roles.cache.some(r => r.name === 'مبرمج') || await isAdmin(message.member, db);
        if (!authorized)
            return message.reply('❌ You do not have permission to execute ban commands.');
        const mentionId = message.mentions.users.first()?.id || args[0]?.replace(/\D/g, '');
        if (!mentionId) return message.reply('❌ Specify the player to ban. Example: `-بنعال-عسيري @player`');
        let target;
        try { target = await message.guild.members.fetch(mentionId); } catch { target = null; }
        if (!target) return message.reply('❌ Player not found in the server.');
        const username = target.user.username;
        await target.ban({ reason: `Permanent ban — By ${message.author.username}`, deleteMessageSeconds: 0 });
        await message.channel.send(`🚫 Player **${username}** has been permanently banned from the server.`);
    }
};
