const { EmbedBuilder } = require('discord.js');
const { logEvent } = require('../loggers');

module.exports = {
    name: 'نقل',
    async execute(message, args, db) {
        const target = message.mentions.members?.first();
        if (!target) {
            return message.reply('❌ Usage: `-نقل [Item name] @user`\nExample: `-نقل سنارة @player`');
        }
        const itemName = args.slice(0, args.findIndex(a => a.startsWith('<@'))).join(' ').trim()
            || args.filter(a => !a.startsWith('<@')).join(' ').trim();
        if (!itemName) {
            return message.reply('❌ You must specify an item name. Example: `-نقل سنارة @player`');
        }
        if (target.id === message.author.id) {
            return message.reply('❌ You cannot transfer an item to yourself.');
        }
        await db.ensureUser(message.author.id, message.author.username);
        await db.ensureUser(target.id, target.user.username);
        const result = await db.transferItem(message.author.id, target.id, itemName);
        if (!result.success) {
            return message.reply(`❌ ${result.error}`);
        }
        const _img = await db.getImage('market').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('Item Transferred')
            .setColor(0xE53935)
            .addFields(
                { name: '👤 Sender', value: `${message.author}`, inline: true },
                { name: '🎯 Recipient', value: `${target}`, inline: true },
                { name: '📦 Item', value: `\`${itemName}\``, inline: true },
            )
            .setFooter({ text: 'Bag System • FANTASY Bot' })
            .setTimestamp();
        if (_img) embed.setImage(_img);
        message.channel.send({ embeds: [embed] });
        logEvent(message.client, db, 'market', embed).catch(() => {});
    }
};
