module.exports = {
    name: 'مسح',
    async execute(message, args, db) {
        const deleteRoleId = await db.getConfig('delete_role_id');
        if (!deleteRoleId)
            return message.reply('❌ لم يتم تعيين رتبة مسؤولي الحذف بعد.');
        if (!message.member.roles.cache.has(deleteRoleId))
            return message.reply('❌ ليس لديك صلاحية تنفيذ أمر الحذف.');

        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100)
            return message.reply('❌ حدد عدداً بين 1 و 100. مثال: `-مسح 10`');

        await message.delete().catch(() => {});
        const deleted = await message.channel.bulkDelete(amount, true).catch(() => null);
        if (!deleted) return message.channel.send('❌ فشل الحذف — قد تكون الرسائل أقدم من 14 يوم.').then(m => setTimeout(() => m.delete().catch(() => {}), 5000));

        const notice = await message.channel.send(`🗑️ تم حذف **${deleted.size}** رسالة.`);
        setTimeout(() => notice.delete().catch(() => {}), 4000);
    }
};
