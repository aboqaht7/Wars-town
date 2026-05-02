module.exports = {
    name: 'باند',
    async execute(message, args, db) {
        const { isAdmin } = require('../utils');
        const { EmbedBuilder } = require('discord.js');
        const { logEvent } = require('../loggers');

        // ── صلاحيات ──────────────────────────────────────────────────────
        const permRoleId = await db.getConfig('ban_role_id');
        const authorized = permRoleId
            ? message.member.roles.cache.has(permRoleId)
            : await isAdmin(message.member, db);
        if (!authorized)
            return message.reply('ليس لديك صلاحية لتنفيذ الباند.');

        // ── تحديد اللاعب (منشن أو ID) ────────────────────────────────────
        const target = message.mentions.members?.first()
            || message.guild?.members.cache.get(args[0]);
        if (!target)
            return message.reply(
                'الاستخدام: `-باند @لاعب [مدة] [سبب]`\n' +
                'مثال: `-باند @لاعب 7d سلوك مخالف`\n' +
                'الصيغ المقبولة للمدة: `30m` `2h` `1d` `1w` `30دقيقة` `2ساعة` `7يوم` `1أسبوع`'
            );

        if (target.id === message.author.id)
            return message.reply('لا يمكنك باند نفسك.');

        // ── تحليل باقي الإدخال (المدة والسبب بأي ترتيب) ────────────────
        const rest = args.slice(1);
        let parsed  = null;
        let durIdx  = -1;

        for (let i = 0; i < rest.length; i++) {
            const p = parseDuration(rest[i]);
            if (p) { parsed = p; durIdx = i; break; }
        }

        if (!parsed)
            return message.reply(
                'يجب تحديد مدة الباند.\n' +
                'صيغ مقبولة: `30m` `2h` `1d` `1w` `30دقيقة` `2ساعة` `7يوم` `1أسبوع`'
            );

        const reason = rest.filter((_, i) => i !== durIdx).join(' ').trim() || 'لم يُحدد سبب';

        // ── رتبة الباند ───────────────────────────────────────────────────
        const bandRoleId = await db.getConfig('violation_role_id');
        if (!bandRoleId)
            return message.reply('رتبة الباند لم تُحدد بعد. استخدم `/تعيين-رتبة-مبند` أولاً.');

        const bandRole = message.guild.roles.cache.get(bandRoleId);
        if (!bandRole)
            return message.reply('رتبة الباند غير موجودة في السيرفر. أعد تعيينها.');

        // ── حفظ جميع رتب اللاعب الحالية ─────────────────────────────────
        const savedRoles = target.roles.cache
            .filter(r => r.id !== message.guild.id && r.id !== bandRoleId)
            .map(r => r.id);

        const expiresAt = new Date(Date.now() + parsed.ms);

        // ── حفظ في قاعدة البيانات ────────────────────────────────────────
        await db.addBand(target.id, message.author.id, reason, expiresAt, savedRoles);

        // ── إزالة جميع الرتب وإعطاء رتبة الباند ─────────────────────────
        await target.roles.set([bandRole]).catch(() => {});

        const expiresFormatted = expiresAt.toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' });

        // ── الإعلان في القناة ─────────────────────────────────────────────
        const _img = await db.getImage('admin').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('باند')
            .setColor(0xB71C1C)
            .addFields(
                { name: 'المنفذ',     value: `${message.author}`, inline: true },
                { name: 'اللاعب',    value: `${target}`,          inline: true },
                { name: 'المدة',      value: parsed.label,         inline: true },
                { name: 'السبب',      value: reason,               inline: false },
                { name: 'ينتهي في',  value: expiresFormatted,      inline: false },
            )
            .setFooter({ text: 'نظام الباند • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);
        await message.channel.send({ embeds: [embed] });

        // ── لوق العملية في روم الباند ────────────────────────────────────
        const logEmbed = EmbedBuilder.from(embed)
            .setTitle('لوق: تنفيذ باند')
            .addFields({ name: 'القناة', value: `<#${message.channel.id}>`, inline: true });
        logEvent(message.client, db, 'band', logEmbed);

        // ── إشعار اللاعب ──────────────────────────────────────────────────
        try {
            await target.send(
                `تم تطبيق باند عليك في سيرفر **${message.guild.name}**\n` +
                `> **السبب:** ${reason}\n` +
                `> **المدة:** ${parsed.label}\n` +
                `> **ينتهي في:** ${expiresFormatted}`
            );
        } catch (_) {}
    }
};

/* ── دالة تحليل المدة — تقبل صيغ عربية وإنجليزية متعددة ─────────────── */
function parseDuration(input) {
    if (!input) return null;
    const s = input.trim();

    const patterns = [
        { re: /^(\d+)\s*(w|week|weeks|أسبوع|اسبوع|أسابيع|اسابيع)$/iu, unit: 'w' },
        { re: /^(\d+)\s*(d|day|days|يوم|أيام|ايام|ي)$/iu,             unit: 'd' },
        { re: /^(\d+)\s*(h|hr|hrs|hour|hours|ساعة|ساعه|ساعات|س)$/iu,  unit: 'h' },
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
