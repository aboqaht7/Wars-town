module.exports = {
    name: 'شقلب',
    async execute(message, args, db) {
        const { isAdmin } = require('../utils');
        const banRoleId = await db.getConfig('ban_role_id');
        const authorized = banRoleId
            ? message.member.roles.cache.has(banRoleId)
            : message.member.roles.cache.some(r => r.name === 'مبرمج') || await isAdmin(message.member, db);
        if (!authorized)
            return message.reply('❌ You do not have permission to execute ban commands.');
        const target = message.mentions.members?.first() || message.guild?.members.cache.get(args[0]);
        if (!target) return message.reply('❌ Specify the player to ban. Example: `-شقلب @player`');
        const username = target.user.username;
        await target.ban({ reason: `Permanent ban — By ${message.author.username}`, deleteMessageSeconds: 0 });
        await message.channel.send(`🚫 Player **${username}** has been permanently banned from the server.`);
    }
};
