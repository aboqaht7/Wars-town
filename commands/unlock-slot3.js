const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'فتح-شخصية-ثالثة',
    async execute(message, args, db) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply('❌ This command is for admins only.');
        }
        const target = message.mentions.users.first();
        if (!target) return message.reply('❌ Mention a player: `-فتح-شخصية-ثالثة @player`');

        await db.ensureUser(target.id, target.username);
        const alreadyUnlocked = await db.isSlot3Unlocked(target.id);
        if (alreadyUnlocked) {
            return message.reply(`❌ Character slot 3 is already unlocked for **${target.username}**.`);
        }

        await db.unlockSlot3(target.id);

        const _img = await db.getImage('identity').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('Character Slot 3 Unlocked')
            .setColor(0x6A1B9A)
            .setDescription(`**Character Slot 3** has been unlocked for <@${target.id}>`)
            .addFields(
                { name: '👤 Player',  value: `<@${target.id}> — \`${target.username}\``, inline: true },
                { name: '✅ Status',  value: 'Character Slot 3 is now available for creation', inline: true },
            )
            .setFooter({ text: 'Identity System • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);
        message.channel.send({ embeds: [embed] });

        try {
            await target.send(`🔓 **Your third character slot has been unlocked!**\nYou can now create an identity in Character Slot 3 via \`/identity\`.`);
        } catch {}
    }
};
