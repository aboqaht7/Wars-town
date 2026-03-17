module.exports = {
    name: 'مخالف',
    async execute(message, args, db) {
        const { isAdmin } = require('../utils');
        const banRoleId = await db.getConfig('ban_role_id');
        const authorized = banRoleId
            ? message.member.roles.cache.has(banRoleId)
            : message.member.roles.cache.some(r => r.name === 'مبرمج') || await isAdmin(message.member, db);
        if (!authorized)
            return message.reply('❌ ليس لديك صلاحية تنفيذ أوامر الباند.');

        const target = message.mentions.members?.first()
            || message.guild?.members.cache.get(args[0]);
        if (!target)
            return message.reply('❌ استخدم: `-مخالف @اللاعب [المدة] [السبب]`\nمثال: `-مخالف @فلان 2h سبب المخالفة`');

        const durationStr = args[1];
        const reason = args.slice(2).join(' ').trim();

        if (!durationStr || !reason)
            return message.reply('❌ يجب تحديد المدة والسبب.\nمثال: `-مخالف @فلان 30m سبب المخالفة`\nالمدة: `Xm` دقائق | `Xh` ساعات | `Xd` أيام');

        const parsed = parseDuration(durationStr);
        if (!parsed)
            return message.reply('❌ صيغة المدة خاطئة.\nأمثلة: `30m` | `2h` | `1d`');

        const roleId = await db.getConfig('violation_role_id');
        if (!roleId)
            return message.reply('❌ لم يتم تعيين رتبة المبند بعد. استخدم `/تعيين-رتبة-مبند` أولاً.');

        const role = message.guild.roles.cache.get(roleId);
        if (!role)
            return message.reply('❌ الرتبة المحفوظة غير موجودة في السيرفر. أعد تعيينها.');

        // حفظ جميع رتب اللاعب الحالية (ما عدا @everyone ورتبة الباند)
        const savedRoles = target.roles.cache
            .filter(r => r.id !== message.guild.id && r.id !== roleId)
            .map(r => r.id);

        const expiresAt = new Date(Date.now() + parsed.ms);
        await db.addViolation(target.id, message.author.id, reason, expiresAt, savedRoles);

        // إزالة كل الرتب وإعطاء رتبة الباند فقط
        await target.roles.set([role]).catch(() => {});

        const expiresFormatted = expiresAt.toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' });

        await message.channel.send(
            `🚫 **تم إصدار مخالفة بحق ${target}**\n` +
            `> **السبب:** ${reason}\n` +
            `> **المدة:** ${parsed.label}\n` +
            `> **تنتهي:** ${expiresFormatted}\n` +
            `> **المنفذ:** ${message.author}`
        );

        try {
            await target.send(
                `⚠️ **تلقيت مخالفة في سيرفر ${message.guild.name}**\n` +
                `> **السبب:** ${reason}\n` +
                `> **المدة:** ${parsed.label}\n` +
                `> **تنتهي:** ${expiresFormatted}`
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
    const label = unit === 'm' ? `${num} دقيقة`
                : unit === 'h' ? `${num} ساعة`
                :                `${num} يوم`;
    return { ms, label };
}
