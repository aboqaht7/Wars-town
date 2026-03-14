const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'تحويل',
    async execute(message, args, db) {
        const iban = args[0];
        const amount = parseInt(args[1]);
        if (!iban || iban.length !== 7 || isNaN(Number(iban))) {
            return message.reply('❌ استخدم: `-تحويل [إيبان مكون من 7 أرقام] [المبلغ]`\nمثال: `-تحويل 1234567 500`');
        }
        if (!amount || amount <= 0) {
            return message.reply('❌ يجب تحديد مبلغ صحيح أكبر من 0.');
        }
        await db.ensureUser(message.author.id, message.author.username);
        const result = await db.transferMoney(message.author.id, iban, amount);
        if (!result.success) {
            return message.reply(`❌ ${result.error}`);
        }
        const embed = new EmbedBuilder()
            .setTitle('💸 تم التحويل بنجاح')
            .setColor(0x2E7D32)
            .addFields(
                { name: '👤 المُرسِل', value: `${message.author} — شخصية ${result.sender.slot}`, inline: true },
                { name: '🏦 المُستلِم', value: `الإيبان: \`${iban}\``, inline: true },
                { name: '💰 المبلغ المحوّل', value: `\`${amount.toLocaleString()} ريال\``, inline: true },
                { name: '📊 رصيدك بعد التحويل', value: `\`${(Number(result.sender.balance) - amount).toLocaleString()} ريال\``, inline: true },
            )
            .setFooter({ text: 'نظام البنك • بوت FANTASY' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
};
