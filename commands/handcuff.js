const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'كلبشة',

    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);

        const loginErr = await db.checkLoginAndIdentity(message.author.id);
        if (loginErr) return message.reply(loginErr);

        const target = message.mentions.members?.first();
        if (!target) return message.reply('❌ Usage: `-كلبشة @player`');
        if (target.id === message.author.id) return message.reply('❌ You cannot handcuff yourself.');
        if (target.user.bot) return message.reply('❌ You cannot handcuff a bot.');

        const hasCuffs = await db.hasItem(message.author.id, 'كلبشات');
        if (!hasCuffs) return message.reply('❌ You do not have **Handcuffs** in your bag.');

        const alreadyCuffed = await db.isCuffed(target.id);
        if (alreadyCuffed) return message.reply(`❌ <@${target.id}> is already handcuffed.`);

        await db.removeItem(message.author.id, 'كلبشات', 1);
        await db.cuffPlayer(target.id, message.author.id);

        const _img = await db.getImage('admin').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('Handcuffed')
            .setColor(0xE53935)
            .setDescription(`Successfully handcuffed <@${target.id}>.\n⚠️ The handcuffed player cannot perform any actions.`)
            .addFields(
                { name: '👮 Executed By', value: `<@${message.author.id}>`, inline: true },
                { name: '🎯 Target',      value: `<@${target.id}>`,         inline: true },
                { name: '📋 Status',      value: '`Handcuffed 🔗`',         inline: true },
            )
            .setFooter({ text: 'Police System • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);
        message.channel.send({ embeds: [embed] });
        message.delete().catch(() => {});
    }
};
