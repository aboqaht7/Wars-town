const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'سرقة',

    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);

        const loginErr = await db.checkLoginAndIdentity(message.author.id);
        if (loginErr) return message.reply(loginErr);

        const target = message.mentions.members?.first();
        if (!target) return message.reply('❌ استخدم: `-سرقة @اللاعب`');
        if (target.id === message.author.id) return message.reply('❌ لا تقدر تسرق نفسك.');
        if (target.user.bot) return message.reply('❌ لا تقدر تسرق بوت.');

        const cuffData = await db.isCuffed(target.id);
        if (!cuffData) return message.reply(`❌ <@${target.id}> يجب أن يكون **مكبّلاً** حتى تتمكن من سرقته.`);

        const executorIdentity = await db.getActiveIdentity(message.author.id);
        if (!executorIdentity) return message.reply('❌ لازم تملك هوية نشطة.');

        const targetIdentity = await db.getActiveIdentity(target.id);
        const targetInventory = await db.getInventory(target.id);

        let stolenCash = 0;
        const stolenItems = [];

        if (targetIdentity && Number(targetIdentity.cash) > 0) {
            const pct = 0.3 + Math.random() * 0.5;
            stolenCash = Math.floor(Number(targetIdentity.cash) * pct);
            if (stolenCash > 0) {
                await db.addToCash(target.id, targetIdentity.slot, -stolenCash);
                await db.addToCash(message.author.id, executorIdentity.slot, stolenCash);
            }
        }

        for (const inv of targetInventory) {
            if (inv.quantity > 0) {
                const qtyToSteal = inv.quantity;
                await db.removeItem(target.id, inv.item_name, qtyToSteal);
                await db.addItem(message.author.id, inv.item_name, qtyToSteal);
                stolenItems.push(`\`${inv.item_name}\` ×${qtyToSteal}`);
            }
        }

        const cashLine  = stolenCash > 0
            ? `💵 كاش: **${stolenCash.toLocaleString('en-US')} ريال**`
            : '💵 كاش: لا يوجد';
        const itemsLine = stolenItems.length > 0
            ? `🎒 أغراض:\n${stolenItems.join('\n')}`
            : '🎒 أغراض: لا يوجد';

        const embed = new EmbedBuilder()
            .setTitle('🦹 تمت السرقة')
            .setColor(0x37474F)
            .setDescription(`قام <@${message.author.id}> بسرقة <@${target.id}>`)
            .addFields(
                { name: '💰 المسروقات', value: `${cashLine}\n${itemsLine}`, inline: false },
            )
            .setFooter({ text: 'نظام الجرائم • بوت FANTASY' })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
        message.delete().catch(() => {});
    }
};
