const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'تلويت',
    async execute(message, args, db) {
        const target = message.mentions.members?.first() || message.guild?.members.cache.get(args[0]);
        if (!target) return message.reply('❌ Usage: `-تلويت @player`');

        await db.ensureUser(target.id, target.user.username);
        const items = await db.getInventory(target.id);
        const targetIdentity = await db.getActiveIdentity(target.id);

        const _img = await db.getImage('admin').catch(() => null);

        if (!items.length) {
            const emptyEmbed = new EmbedBuilder()
                .setTitle('Inspect Handcuffed Player')
                .setColor(0xE53935)
                .setDescription(`**${target.displayName}** has been searched — Bag is empty!`)
                .addFields(
                    { name: '👮 Officer',    value: `${message.author}`, inline: true },
                    { name: '🎯 Inspected', value: `${target}`, inline: true },
                    { name: '🏦 Bank Balance', value: `\`${Number(targetIdentity?.balance ?? 0).toLocaleString()} Riyals\``, inline: true },
                    { name: '📦 Bag Contents', value: '> Bag is empty', inline: false },
                )
                .setFooter({ text: 'Police System • FANTASY Bot' })
                .setTimestamp();
            if (_img) emptyEmbed.setImage(_img);
            return message.channel.send({ embeds: [emptyEmbed] });
        }

        const stolenList = items.map(i => `• **${i.item_name}** × \`${i.quantity}\``).join('\n');

        for (const item of items) {
            await db.transferItem(target.id, message.author.id, item.item_name);
            if (item.quantity > 1) {
                for (let i = 1; i < item.quantity; i++) {
                    await db.transferItem(target.id, message.author.id, item.item_name).catch(() => {});
                }
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('Inspect & Rob Handcuffed Player')
            .setColor(0xE53935)
            .addFields(
                { name: '👮 Officer',       value: `${message.author}`, inline: true },
                { name: '🎯 Inspected',     value: `${target}`, inline: true },
                { name: '🏦 Bank Balance',  value: `\`${Number(targetIdentity?.balance ?? 0).toLocaleString()} Riyals\``, inline: true },
                { name: '📦 Items Seized',  value: stolenList, inline: false },
                { name: '📋 Status',        value: '`All items transferred to the officer\'s bag`', inline: false },
            )
            .setFooter({ text: 'Police System • FANTASY Bot' })
            .setTimestamp();
        if (_img) embed.setImage(_img);
        message.channel.send({ embeds: [embed] });
    }
};
