const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'نقل',
    async execute(message, args, db) {
        const target = message.mentions.members?.first();
        if (!target) {
            return message.reply('❌ استخدم: `-نقل [Item name] @المستخدم`\nمثال: `-نقل سنارة @اللاعب`');
        }
        const itemName = args.slice(0, args.findIndex(a => a.startsWith('<@'))).join(' ').trim()
            || args.filter(a => !a.startsWith('<@')).join(' ').trim();
        if (!itemName) {
            return message.reply('❌ يجب تحديد Item name. مثال: `-نقل سنارة @اللاعب`');
        }
        if (target.id === message.author.id) {
            return message.reply('❌ لا يمكنك نقل غرض لنفسك.');
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
            .setColor(0xE65100)
            .addFields(
                { name: '👤 Sender', value: `${message.author}`, inline: true },
                { name: '🎯 المُستلِم', value: `${target}`, inline: true },
                { name: '📦 الغرض', value: `\`${itemName}\``, inline: true },
            )
            .setFooter({ text: 'Bag System • FANTASY Bot' })
            .setTimestamp();
        if (_img) embed.setImage(_img);
        message.channel.send({ embeds: [embed] });
    }
};
