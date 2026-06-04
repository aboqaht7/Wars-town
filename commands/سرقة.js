const { EmbedBuilder } = require('discord.js');
const { logEvent } = require('../loggers');

module.exports = {
    name: 'سرقة',

    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);

        const loginErr = await db.checkLoginAndIdentity(message.author.id);
        if (loginErr) return message.reply(loginErr);

        const target = message.mentions.members?.first();
        if (!target) return message.reply('❌ Usage: `-سرقة @player`');
        if (target.id === message.author.id) return message.reply('❌ You cannot rob yourself.');
        if (target.user.bot) return message.reply('❌ You cannot rob a bot.');

        const cuffData = await db.isCuffed(target.id);
        if (!cuffData) return message.reply(`❌ <@${target.id}> must be **handcuffed** in order to rob them.`);

        const executorIdentity = await db.getActiveIdentity(message.author.id);
        if (!executorIdentity) return message.reply('❌ You must have an active identity.');

        const targetIdentity  = await db.getActiveIdentity(target.id);
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
            ? `💵 Cash: **${stolenCash.toLocaleString('en-US')} Riyals**`
            : '💵 Cash: None';
        const itemsLine = stolenItems.length > 0
            ? `🎒 Items:\n${stolenItems.join('\n')}`
            : '🎒 Items: None';

        const _img = await db.getImage('crime').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('Robbery Committed')
            .setColor(0xE53935)
            .setDescription(`<@${message.author.id}> has robbed <@${target.id}>`)
            .addFields(
                { name: '💰 Stolen', value: `${cashLine}\n${itemsLine}`, inline: false },
            )
            .setFooter({ text: 'Crime System • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);
        message.channel.send({ embeds: [embed] });
        logEvent(message.client, db, 'police', embed).catch(() => {});
        message.delete().catch(() => {});
    }
};
