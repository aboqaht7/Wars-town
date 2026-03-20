const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

function parseDuration(str) {
    if (!str) return null;
    str = str.trim();

    const map = {
        'د': 60_000,
        'م': 60_000,
        'min': 60_000,
        'm': 60_000,
        'س': 3_600_000,
        'h': 3_600_000,
        'ي': 86_400_000,
        'd': 86_400_000,
    };

    for (const [suffix, ms] of Object.entries(map)) {
        if (str.endsWith(suffix)) {
            const num = parseInt(str.slice(0, -suffix.length), 10);
            if (!isNaN(num) && num > 0) return num * ms;
        }
    }

    const num = parseInt(str, 10);
    if (!isNaN(num) && num > 0) return num * 60_000;

    return null;
}

function formatDuration(ms) {
    const days  = Math.floor(ms / 86_400_000);
    const hours = Math.floor((ms % 86_400_000) / 3_600_000);
    const mins  = Math.floor((ms % 3_600_000) / 60_000);
    const parts = [];
    if (days)  parts.push(`${days} يوم`);
    if (hours) parts.push(`${hours} ساعة`);
    if (mins)  parts.push(`${mins} دقيقة`);
    return parts.join(' و') || 'أقل من دقيقة';
}

const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

module.exports = {
    name: 'اسكت',

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ ليس لديك صلاحية تنفيذ هذا الأمر.');
        }

        const target = message.mentions.members?.first();
        if (!target) {
            return message.reply('❌ **الاستخدام:** `-اسكت @العضو [المدة]`\n> مثال: `-اسكت @فلان 10م` أو `-اسكت @فلان 1س` أو `-اسكت @فلان 1ي`');
        }

        if (target.id === message.author.id) return message.reply('❌ لا تقدر تسكت نفسك.');
        if (target.user.bot)                  return message.reply('❌ لا تقدر تسكت بوت.');

        if (!target.moderatable) {
            return message.reply('❌ لا أستطيع تطبيق التايم اوت على هذا العضو (رتبته أعلى مني).');
        }

        const durationArg = args.find(a => !a.startsWith('<'));
        const durationMs  = parseDuration(durationArg) ?? 60 * 60_000;

        if (durationMs > MAX_TIMEOUT_MS) {
            return message.reply('❌ الحد الأقصى للمدة هو **28 يوم**.');
        }

        try {
            await target.timeout(durationMs, `تايم اوت بواسطة ${message.author.tag}`);
        } catch (err) {
            console.error('[اسكت] timeout error:', err);
            return message.reply('❌ فشل تطبيق التايم اوت. تأكد من أن البوت لديه الصلاحيات الكافية.');
        }

        const embed = new EmbedBuilder()
            .setColor(0xE53935)
            .setTitle('🔇 تم تطبيق التايم اوت')
            .addFields(
                { name: '👤 العضو',      value: `<@${target.id}>`,          inline: true },
                { name: '⏱️ المدة',      value: formatDuration(durationMs),  inline: true },
                { name: '👮 بواسطة',     value: `<@${message.author.id}>`,  inline: true },
            )
            .setFooter({ text: 'نظام التايم اوت • بوت FANTASY' })
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });
        await message.delete().catch(() => {});
    }
};
