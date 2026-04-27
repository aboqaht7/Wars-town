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
    if (days)  parts.push(`${days} day(s)`);
    if (hours) parts.push(`${hours} hour(s)`);
    if (mins)  parts.push(`${mins} minute(s)`);
    return parts.join(' and ') || 'Less than a minute';
}

const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

module.exports = {
    name: 'اسكت',

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const target = message.mentions.members?.first();
        if (!target) {
            return message.reply('❌ **Usage:** `-اسكت @Member [Duration]`\n> Example: `-اسكت @User 10m` or `-اسكت @User 1h` or `-اسكت @User 1d`');
        }

        if (target.id === message.author.id) return message.reply('❌ You cannot timeout yourself.');
        if (target.user.bot)                  return message.reply('❌ You cannot timeout a bot.');

        if (!target.moderatable) {
            return message.reply('❌ I cannot apply a timeout to this member (their rank is higher than mine).');
        }

        const durationArg = args.find(a => !a.startsWith('<'));
        const durationMs  = parseDuration(durationArg) ?? 60 * 60_000;

        if (durationMs > MAX_TIMEOUT_MS) {
            return message.reply('❌ Maximum duration is **28 days**.');
        }

        try {
            await target.timeout(durationMs, `Timeout by ${message.author.tag}`);
        } catch (err) {
            console.error('[اسكت] timeout error:', err);
            return message.reply('❌ Failed to apply timeout. Make sure the bot has sufficient permissions.');
        }

        const embed = new EmbedBuilder()
            .setColor(0xE53935)
            .setTitle('Timeout Applied')
            .addFields(
                { name: '👤 Member',   value: `<@${target.id}>`,          inline: true },
                { name: '⏱️ Duration', value: formatDuration(durationMs),  inline: true },
                { name: '👮 By',       value: `<@${message.author.id}>`,   inline: true },
            )
            .setFooter({ text: 'Timeout System • FANTASY Bot' })
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });
        await message.delete().catch(() => {});
    }
};
