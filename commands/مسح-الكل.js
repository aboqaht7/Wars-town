module.exports = {
    name: 'مسح-الكل',
    async execute(message, args, db) {
        const deleteRoleId = await db.getConfig('delete_role_id');
        if (!deleteRoleId)
            return message.reply('❌ لم يتم تعيين رتبة مسؤولي الحذف بعد.');
        if (!message.member.roles.cache.has(deleteRoleId))
            return message.reply('❌ ليس لديك صلاحية تنفيذ أمر الحذف.');

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

        const notice = await message.channel.send(`🗑️ تم مسح **${total}** رسالة من الروم.`);
        setTimeout(() => notice.delete().catch(() => {}), 5000);
    }
};
