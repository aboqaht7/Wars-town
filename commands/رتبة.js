module.exports = {
    name: 'رتبة',

    async execute(message, args, db) {
        if (!message.member.permissions.has(0x10000000n)) {
            return message.channel.send('❌ ما عندك صلاحية إعطاء رتب.');
        }

        const member = message.mentions.members.first();
        const role   = message.mentions.roles.first();

        if (!member) return message.channel.send('❌ منشن الشخص الصح. مثال: `-رتبة @شخص @رتبة`');
        if (!role)   return message.channel.send('❌ منشن الرتبة الصح. مثال: `-رتبة @شخص @رتبة`');

        if (!message.guild.members.me.permissions.has(0x10000000n)) {
            return message.channel.send('❌ البوت ما عنده صلاحية إعطاء رتب.');
        }

        if (role.position >= message.guild.members.me.roles.highest.position) {
            return message.channel.send('❌ الرتبة أعلى من رتبة البوت، ما يقدر يعطيها.');
        }

        const { EmbedBuilder } = require('discord.js');

        if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
            const embed = new EmbedBuilder()
                .setColor(0xB71C1C)
                .setDescription(`🔴 تم سحب رتبة **${role.name}** من <@${member.id}>.`)
                .setFooter({ text: `بواسطة: ${message.author.username}` })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        } else {
            await member.roles.add(role);
            const embed = new EmbedBuilder()
                .setColor(0x1565C0)
                .setDescription(`✅ تم إعطاء رتبة **${role.name}** لـ <@${member.id}>.`)
                .setFooter({ text: `بواسطة: ${message.author.username}` })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }
    }
};
