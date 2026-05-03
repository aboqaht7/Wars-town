const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'تحويل',
    async execute(message, args, db) {
        const iban = args[0];
        const amount = parseInt(args[1]);
        if (!iban || iban.length !== 7 || isNaN(Number(iban))) {
            return message.reply('❌ Usage: `-تحويل [7-digit IBAN] [amount]`\nExample: `-تحويل 1234567 500`');
        }
        if (!amount || amount <= 0) {
            return message.reply('❌ You must specify a valid amount greater than 0.');
        }
        await db.ensureUser(message.author.id, message.author.username);
        const result = await db.transferMoney(message.author.id, iban, amount);
        if (!result.success) {
            return message.reply(`❌ ${result.error}`);
        }
        const _img = await db.getImage('bank').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('Transfer Successful')
            .setColor(0xE53935)
            .addFields(
                { name: '👤 Sender',                   value: `${message.author} — Slot ${result.sender.slot}`, inline: true },
                { name: '🏦 Recipient IBAN',           value: `\`${iban}\``, inline: true },
                { name: '💰 Amount Transferred',       value: `\`${amount.toLocaleString()} Riyals\``, inline: true },
                { name: '📊 Your Balance After Transfer', value: `\`${(Number(result.sender.balance) - amount).toLocaleString()} Riyals\``, inline: true },
            )
            .setFooter({ text: 'Bank System • FANTASY Bot' })
            .setTimestamp();
        if (_img) embed.setImage(_img);
        message.channel.send({ embeds: [embed] });
    }
};
