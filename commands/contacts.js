const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'جهات',
    async execute(message, args, db) {
        const target = message.mentions.members?.first();

        if (target) {
            const nickname = args.filter(a => !a.startsWith('<@')).join(' ').trim() || target.user.username;
            await db.ensureUser(message.author.id, message.author.username);
            await db.ensureUser(target.id, target.user.username);
            await db.addContact(message.author.id, target.id, nickname);
            const _img = await db.getImage('phone').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Contact Added')
                .setColor(0xE53935)
                .addFields(
                    { name: '👤 Contact', value: `${target}`, inline: true },
                    { name: '🏷️ Saved Name', value: `\`${nickname}\``, inline: true },
                )
                .setFooter({ text: 'Phone System • FANTASY Bot' })
                .setTimestamp();
            if (_img) embed.setImage(_img);
            return message.channel.send({ embeds: [embed] });
        }

        await db.ensureUser(message.author.id, message.author.username);
        const contacts = await db.getContacts(message.author.id);
        const _img = await db.getImage('phone').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('Contacts')
            .setColor(0xE53935)
            .setDescription(contacts.length
                ? contacts.map(c => `• ${c.nickname || c.username} — \`<@${c.contact_id}>\``).join('\n')
                : '> No contacts. Use `-contacts @user [name]` to add one')
            .addFields({ name: '📊 Count', value: `\`${contacts.length}\``, inline: true })
            .setFooter({ text: 'Phone System • FANTASY Bot' })
            .setTimestamp();
        if (_img) embed.setImage(_img);
        message.channel.send({ embeds: [embed] });
    }
};
