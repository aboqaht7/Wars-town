module.exports = {
    name: 'مخالف',
    async execute(message, args, db) {
        const { isAdmin } = require('../utils');

        // ── صلاحيات ──────────────────────────────────────────────────────
        const permRoleId = await db.getConfig('ban_role_id');
        const authorized = permRoleId
            ? message.member.roles.cache.has(permRoleId)
            : message.member.roles.cache.some(r => r.name === 'مبرمج') || await isAdmin(message.member, db);
        if (!authorized)
            return message.reply('ليس لديك صلاحية لإصدار مخالفة.');

        // ── تحديد اللاعب (منشن أو ID) ────────────────────────────────────
        const target = message.mentions.members?.first()
            || message.guild?.members.cache.get(args[0]);
        if (!target)
            return message.reply(
                'الاستخدام: `-مخالف @لاعب [مدة] [سبب]`\n' +
                'مثال: `-مخالف @لاعب 2h تصرف مخالف`\n' +
                'الصيغ المقبولة للمدة: `30m` `2h` `1d` `1w` `30دقيقة` `2ساعة` `7يوم` `1أسبوع`'
            );

        // ── تحليل باقي الإدخال (المدة والسبب بأي ترتيب) ────────────────
        const rest = args.slice(1);
        let parsed = null;
        let durIdx  = -1;

        for (let i = 0; i < rest.length; i++) {
            const p = parseDuration(rest[i]);
            if (p) { parsed = p; durIdx = i; break; }
        }

        if (!parsed)
            return message.reply(
                'يجب تحديد مدة المخالفة.\n' +
                'صيغ مقبولة: `30m` `2h` `1d` `1w` `30دقيقة` `2ساعة` `7يوم` `1أسبوع`'
            );

        const reason = rest.filter((_, i) => i !== durIdx).join(' ').trim();
        if (!reason)
            return message.reply('يجب تحديد سبب المخالفة.\nمثال: `-مخالف @لاعب 2h تصرف مخالف للقواعد`');

        // ── رتبة المبند ───────────────────────────────────────────────────
        const roleId = await db.getConfig('violation_role_id');
        if (!roleId)
            return message.reply('رتبة المبند لم تُحدد بعد. استخدم `/تعيين-رتبة-مبند` أولاً.');

        const role = message.guild.roles.cache.get(roleId);
        if (!role)
            return message.reply('رتبة المبند غير موجودة في السيرفر. أعد تعيينها.');

        // ── حفظ الرتب الحالية وتطبيق المخالفة ───────────────────────────
        const savedRoles = target.roles.cache
            .filter(r => r.id !== message.guild.id && r.id !== roleId)
            .map(r => r.id);

        const expiresAt = new Date(Date.now() + parsed.ms);
        await db.addViolation(target.id, message.author.id, reason, expiresAt, savedRoles);
        await target.roles.set([role]).catch(() => {});

        const expiresFormatted = expiresAt.toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' });

        await message.channel.send(
            `تم إصدار مخالفة بحق ${target}\n` +
            `> **السبب:** ${reason}\n` +
            `> **المدة:** ${parsed.label}\n` +
            `> **تنتهي:** ${expiresFormatted}\n` +
            `> **بواسطة:** ${message.author}`
        );

        try {
            await target.send(
                `صدرت بحقك مخالفة في سيرفر **${message.guild.name}**\n` +
                `> **السبب:** ${reason}\n` +
                `> **المدة:** ${parsed.label}\n` +
                `> **تنتهي:** ${expiresFormatted}`
            );
        } catch (_) {}
    }
};

/* ── دالة تحليل المدة — تقبل صيغ عربية وإنجليزية متعددة ─────────────── */
function parseDuration(input) {
    if (!input) return null;
    const s = input.trim();

    const patterns = [
        // أسابيع
        { re: /^(\d+)\s*(w|week|weeks|أسبوع|اسبوع|أسابيع|اسابيع)$/iu, unit: 'w' },
        // أيام
        { re: /^(\d+)\s*(d|day|days|يوم|أيام|ايام|ي)$/iu, unit: 'd' },
        // ساعات
        { re: /^(\d+)\s*(h|hr|hrs|hour|hours|ساعة|ساعه|ساعات|س)$/iu, unit: 'h' },
        // دقائق
        { re: /^(\d+)\s*(m|min|mins|minute|minutes|دقيقة|دقيقه|دقائق|د)$/iu, unit: 'm' },
    ];

    for (const p of patterns) {
        const m = s.match(p.re);
        if (!m) continue;
        const num = parseInt(m[1]);
        if (num <= 0) return null;
        const ms = p.unit === 'w' ? num * 604_800_000
                 : p.unit === 'd' ? num * 86_400_000
                 : p.unit === 'h' ? num * 3_600_000
                 :                  num * 60_000;
        const label = p.unit === 'w' ? `${num} أسبوع`
                    : p.unit === 'd' ? `${num} يوم`
                    : p.unit === 'h' ? `${num} ساعة`
                    :                  `${num} دقيقة`;
        return { ms, label };
    }
    return null;
}
