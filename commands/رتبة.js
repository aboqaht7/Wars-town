module.exports = {
    name: 'Rank',

    async execute(message, args, db) {
        if (!message.member.permissions.has(0x10000000n)) {
            return message.channel.send('❌ ما عندك صلاحية إعطاء رتب.');
        }

        const member = message.mentions.members.first();
        const role   = message.mentions.roles.first();

        if (!member) return message.channel.send('❌ منشن الشخص الصح. مثال: `-Rank @شخص @Rank`');
        if (!role)   return message.channel.send('❌ منشن الRank الصح. مثال: `-Rank @شخص @Rank`');

        if (!message.guild.members.me.permissions.has(0x10000000n)) {
            return message.channel.send('❌ البوت ما عنده صلاحية إعطاء رتب.');
        }

        if (role.position >= message.guild.members.me.roles.highest.position) {
            return message.channel.send('❌ الRank أعلى من Rank البوت، ما يقدر يعطيها.');
        }

        const { EmbedBuilder } = require('discord.js');

        if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
            const embed = new EmbedBuilder()
                .setColor(0xB71C1C)
                .setDescription(`🔴 تم سحب Rank **${role.name}** من <@${member.id}>.`)
                .setFooter({ text: `بواسطة: ${message.author.username}` })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        } else {
            await member.roles.add(role);
            const embed = new EmbedBuilder()
                .setColor(0x1565C0)
                .setDescription(`✅ تم إعطاء Rank **${role.name}** لـ <@${member.id}>.`)
                .setFooter({ text: `بواسطة: ${message.author.username}` })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }
    }
};
