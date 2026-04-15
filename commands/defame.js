module.exports = {
    name: 'تشهير',
    async execute(message, args, db) {
        const target = message.mentions.members?.first() || message.guild?.members.cache.get(args[0]);
        const reason = args.slice(1).join(' ') || 'لم يُذكر سبب';
        if (!target) return message.reply('❌ يجب ذكر اللاعب المراد تشهيره. مثال: `-تشهير @اللاعب السبب`');
        const { EmbedBuilder } = require('discord.js');
        const _img = await db.getImage('admin').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('Defamation Executed')
            .setColor(0x6A1B9A)
            .addFields(
                { name: '👮 Executed By', value: `${message.author}`, inline: true },
                { name: '🎯 Target', value: `${target}`, inline: true },
                { name: '📋 Status', value: '`Defamed`', inline: true },
                { name: '📝 Reason', value: reason, inline: false },
            )
            .setFooter({ text: 'Police System • FANTASY Bot' })
            .setTimestamp();
        if (_img) embed.setImage(_img);
        message.channel.send({ embeds: [embed] });
    }
};
