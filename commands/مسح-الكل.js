module.exports = {
    name: 'مسح-الكل',
    async execute(message, args, db) {
        const deleteRoleId = await db.getConfig('delete_role_id');
        if (!deleteRoleId)
            return message.reply('❌ The deletion admin role has not been set yet.');
        if (!message.member.roles.cache.has(deleteRoleId))
            return message.reply('❌ You do not have permission to use the delete command.');

        await message.delete().catch(() => {});

        let total = 0;
        while (true) {
            const fetched = await message.channel.messages.fetch({ limit: 100 });
            if (fetched.size === 0) break;

            const recent = fetched.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);
            if (recent.size > 0) {
                const deleted = await message.channel.bulkDelete(recent, true).catch(() => null);
                if (deleted) total += deleted.size;
            }

            const old = fetched.filter(m => Date.now() - m.createdTimestamp >= 14 * 24 * 60 * 60 * 1000);
            for (const [, msg] of old) {
                await msg.delete().catch(() => {});
                total++;
            }

            if (fetched.size < 100) break;
        }

        const notice = await message.channel.send(`🗑️ **${total}** message(s) cleared from the channel.`);
        setTimeout(() => notice.delete().catch(() => {}), 5000);
    }
};
