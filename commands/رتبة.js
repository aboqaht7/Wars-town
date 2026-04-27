module.exports = {
    name: 'Rank',

    async execute(message, args, db) {
        if (!message.member.permissions.has(0x10000000n)) {
            return message.channel.send('❌ You do not have permission to assign roles.');
        }

        const member = message.mentions.members.first();
        const role   = message.mentions.roles.first();

        if (!member) return message.channel.send('❌ Mention the correct member. Example: `-Rank @member @Role`');
        if (!role)   return message.channel.send('❌ Mention the correct role. Example: `-Rank @member @Role`');

        if (!message.guild.members.me.permissions.has(0x10000000n)) {
            return message.channel.send('❌ The bot does not have permission to manage roles.');
        }

        if (role.position >= message.guild.members.me.roles.highest.position) {
            return message.channel.send('❌ The role is higher than the bot\'s highest role and cannot be assigned.');
        }

        const { EmbedBuilder } = require('discord.js');

        if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
            const embed = new EmbedBuilder()
                .setColor(0xB71C1C)
                .setDescription(`🔴 Role **${role.name}** has been removed from <@${member.id}>.`)
                .setFooter({ text: `By: ${message.author.username}` })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        } else {
            await member.roles.add(role);
            const embed = new EmbedBuilder()
                .setColor(0x1565C0)
                .setDescription(`✅ Role **${role.name}** has been given to <@${member.id}>.`)
                .setFooter({ text: `By: ${message.author.username}` })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }
    }
};
