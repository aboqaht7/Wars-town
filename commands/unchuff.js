const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'فك-كلبشة',

    async execute(message, args, db) {
        const target = message.mentions.members?.first();
        if (!target) return message.reply('❌ Usage: `-فك-كلبشة @player`');

        const cuffData = await db.isCuffed(target.id);
        if (!cuffData) return message.reply(`❌ <@${target.id}> is not handcuffed.`);

        await db.uncuffPlayer(target.id);

        const _img = await db.getImage('admin').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('Handcuffs Removed')
            .setColor(0x2E7D32)
            .addFields(
                { name: '👮 Executed By', value: `<@${message.author.id}>`, inline: true },
                { name: '🎯 Player',      value: `<@${target.id}>`,         inline: true },
                { name: '📋 Status',      value: '`Released 🔓`',           inline: true },
            )
            .setFooter({ text: 'Police System • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);
        message.channel.send({ embeds: [embed] });
        message.delete().catch(() => {});
    }
};
