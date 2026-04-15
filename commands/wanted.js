const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'تلويت',
    async execute(message, args, db) {
        const target = message.mentions.members?.first() || message.guild?.members.cache.get(args[0]);
        if (!target) return message.reply('❌ استخدم: `-تلويت @اللاعب`');

        await db.ensureUser(target.id, target.user.username);
        const items = await db.getInventory(target.id);
        const targetIdentity = await db.getActiveIdentity(target.id);

        if (!items.length) {
            const emptyEmbed = new EmbedBuilder()
                .setTitle('Inspect Handcuffed Player')
                .setColor(0xFF6F00)
                .setDescription(`تم تفتيش **${target.displayName}** — Bag فارغة!`)
                .addFields(
                    { name: '👮 الضابط', value: `${message.author}`, inline: true },
                    { name: '🎯 المفتَّش', value: `${target}`, inline: true },
                    { name: '🏦 رصيد Bank', value: `\`${Number(targetIdentity.balance).toLocaleString()} ريال\``, inline: true },
                    { name: '📦 محتوى Bag', value: '> Bag فارغة', inline: false },
                )
                .setFooter({ text: 'Police System • FANTASY Bot' })
                .setTimestamp();
            if (_img) embed.setImage(_img);
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

        const _img = await db.getImage('admin').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Inspect & Rob Handcuffed Player')
            .setColor(0xFF6F00)
            .addFields(
                { name: '👮 الضابط', value: `${message.author}`, inline: true },
                { name: '🎯 المفتَّش', value: `${target}`, inline: true },
                { name: '🏦 رصيد Bank', value: `\`${Number(targetIdentity.balance).toLocaleString()} ريال\``, inline: true },
                { name: '📦 الأغراض المضبوطة', value: stolenList, inline: false },
                { name: '📋 Status', value: '`تم نقل جميع الأغراض لحقيبة الضابط`', inline: false },
            )
            .setFooter({ text: 'Police System • FANTASY Bot' })
            .setTimestamp();
        if (_img) embed.setImage(_img);
        message.channel.send({ embeds: [embed] });
    }
};
