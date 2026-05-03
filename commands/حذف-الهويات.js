const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'حذف-الهويات',

    async execute(message, args, db) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ This command is for admins only.');
        }

        const _img = await db.getImage('identity').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Confirm Full Deletion')
            .setColor(0xE53935)
            .setDescription(
                '> Are you sure you want to **delete all identities**?\n\n' +
                '⚠️ This action **cannot be undone**.\n' +
                'All identities will be deleted, all accounts will be logged out, and all pending requests will be removed.'
            )
            .setFooter({ text: 'FANTASY Bot • Identity System' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_delete_all_identities').setLabel('Confirm Delete').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('cancel_delete_all_identities').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
        );

        if (_img) embed.setImage(_img);
        message.channel.send({ embeds: [embed], components: [row] });
    }
};
