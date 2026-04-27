module.exports = {
    name: 'مخالف',
    async execute(message, args, db) {
        const { isAdmin } = require('../utils');
        const banRoleId = await db.getConfig('ban_role_id');
        const authorized = banRoleId
            ? message.member.roles.cache.has(banRoleId)
            : message.member.roles.cache.some(r => r.name === 'مبرمج') || await isAdmin(message.member, db);
        if (!authorized)
            return message.reply('❌ You do not have permission to issue violations.');

        const target = message.mentions.members?.first()
            || message.guild?.members.cache.get(args[0]);
        if (!target)
            return message.reply('❌ Usage: `-مخالف @player [duration] [reason]`\nExample: `-مخالف @player 2h reason`');

        const durationStr = args[1];
        const reason = args.slice(2).join(' ').trim();

        if (!durationStr || !reason)
            return message.reply('❌ You must specify a duration and reason.\nExample: `-مخالف @player 30m reason`\nDuration: `Xm` minutes | `Xh` hours | `Xd` days');

        const parsed = parseDuration(durationStr);
        if (!parsed)
            return message.reply('❌ Invalid duration format.\nExamples: `30m` | `2h` | `1d`');

        const roleId = await db.getConfig('violation_role_id');
        if (!roleId)
            return message.reply('❌ Ban role has not been set yet. Use `/تعيين-رتبة-مبند` first.');

        const role = message.guild.roles.cache.get(roleId);
        if (!role)
            return message.reply('❌ The saved ban role no longer exists in the server. Please re-assign it.');

        const savedRoles = target.roles.cache
            .filter(r => r.id !== message.guild.id && r.id !== roleId)
            .map(r => r.id);

        const expiresAt = new Date(Date.now() + parsed.ms);
        await db.addViolation(target.id, message.author.id, reason, expiresAt, savedRoles);

        await target.roles.set([role]).catch(() => {});

        const expiresFormatted = expiresAt.toLocaleString('en-GB', { timeZone: 'Asia/Riyadh' });

        await message.channel.send(
            `🚫 **Violation issued against ${target}**\n` +
            `> **Reason:** ${reason}\n` +
            `> **Duration:** ${parsed.label}\n` +
            `> **Expires:** ${expiresFormatted}\n` +
            `> **Issued by:** ${message.author}`
        );

        try {
            await target.send(
                `⚠️ **You have received a violation in ${message.guild.name}**\n` +
                `> **Reason:** ${reason}\n` +
                `> **Duration:** ${parsed.label}\n` +
                `> **Expires:** ${expiresFormatted}`
            );
        } catch (_) {}
    }
};

function parseDuration(str) {
    const match = str.match(/^(\d+)(m|h|d)$/i);
    if (!match) return null;
    const num = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const ms   = unit === 'm' ? num * 60_000
               : unit === 'h' ? num * 3_600_000
               :                num * 86_400_000;
    const label = unit === 'm' ? `${num} minute(s)`
                : unit === 'h' ? `${num} hour(s)`
                :                `${num} day(s)`;
    return { ms, label };
}
