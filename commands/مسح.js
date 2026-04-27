module.exports = {
    name: 'مسح',
    async execute(message, args, db) {
        const deleteRoleId = await db.getConfig('delete_role_id');
        if (!deleteRoleId)
            return message.reply('❌ The deletion admin role has not been set yet.');
        if (!message.member.roles.cache.has(deleteRoleId))
            return message.reply('❌ You do not have permission to use the delete command.');

        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100)
            return message.reply('❌ Specify a number between 1 and 100. Example: `-مسح 10`');

        await message.delete().catch(() => {});
        const deleted = await message.channel.bulkDelete(amount, true).catch(() => null);
        if (!deleted) return message.channel.send('❌ Deletion failed — messages may be older than 14 days.').then(m => setTimeout(() => m.delete().catch(() => {}), 5000));

        const notice = await message.channel.send(`🗑️ **${deleted.size}** message(s) deleted.`);
        setTimeout(() => notice.delete().catch(() => {}), 4000);
    }
};
