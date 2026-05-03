const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'فك-تايم',

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const target = message.mentions.members?.first();
        if (!target) {
            return message.reply('❌ **Usage:** `-فك-تايم @Member`');
        }

        if (!target.isCommunicationDisabled()) {
            return message.reply(`❌ <@${target.id}> is not currently timed out.`);
        }

        try {
            await target.timeout(null, `Timeout removed by ${message.author.tag}`);
        } catch (err) {
            console.error('[فك-تايم] error:', err);
            return message.reply('❌ Failed to remove timeout. Make sure the bot has sufficient permissions.');
        }

        const embed = new EmbedBuilder()
            .setColor(0xE53935)
            .setTitle('Timeout Removed')
            .addFields(
                { name: '👤 Member', value: `<@${target.id}>`,         inline: true },
                { name: '👮 By',     value: `<@${message.author.id}>`, inline: true },
            )
            .setFooter({ text: 'Timeout System • FANTASY Bot' })
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });
        await message.delete().catch(() => {});
    }
};
