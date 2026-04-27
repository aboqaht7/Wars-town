const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'حذف-هوية',

    data: new SlashCommandBuilder()
        .setName('حذف-هوية')
        .setDescription('حذف هوية محددة للاعب (أدمن فقط)')
        .addUserOption(o => o.setName('لاعب').setDescription('المنشن المراد حذف هويته').setRequired(true))
        .addIntegerOption(o =>
            o.setName('رقم-الهوية')
                .setDescription('رقم الخانة (1 أو 2 أو 3)')
                .setRequired(true)
                .addChoices(
                    { name: 'الهوية الأولى (1)', value: 1 },
                    { name: 'الهوية الثانية (2)', value: 2 },
                    { name: 'الهوية الثالثة (3)', value: 3 },
                )
        ),

    async execute(message, args, db) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ هذا الأمر للمسؤولين فقط.');
        }

        const mention = message.mentions.users.first();
        const slot = parseInt(args[1]);

        if (!mention) return message.reply('❌ Mention the player. Example: `-حذف-هوية @player 1`');
        if (![1, 2, 3].includes(slot)) return message.reply('❌ Slot number must be 1, 2, or 3. Example: `-حذف-هوية @player 2`');

        await handleDelete(message.channel, mention.id, mention.username, slot, db, null);
    },

    async slashExecute(interaction, db) {
        const target = interaction.options.getUser('لاعب');
        const slot   = interaction.options.getInteger('رقم-الهوية');
        await handleDelete(null, target.id, target.username, slot, db, interaction);
    }
};

async function handleDelete(channel, targetId, targetUsername, slot, db, interaction) {
    const identities = await db.getUserIdentities(targetId);
    const identity   = identities.find(i => i.slot === slot);

    if (!identity) {
        const msg = `❌ No identity found in slot **${slot}** for player **${targetUsername}**.`;
        if (interaction) return interaction.reply({ content: msg, flags: 64 });
        return channel.send(msg);
    }

    await db.deleteIdentity(targetId, slot);

    const _img = await db.getImage('identity').catch(() => null);


    const embed = new EmbedBuilder()
        .setTitle('Identity Deleted')
        .setColor(0x757575)
        .addFields(
            { name: '👤 Player',      value: `<@${targetId}>`, inline: true },
            { name: '🔢 Slot',        value: `\`${slot}\``, inline: true },
            { name: '📛 Character',   value: `\`${identity.character_name || 'Not set'} ${identity.family_name || ''}\``.trim(), inline: true },
        )
        .setFooter({ text: 'FANTASY Bot • Identity System' })
        .setTimestamp();

    if (interaction) if (_img) embed.setImage(_img);
 await interaction.channel.send({ embeds: [embed] });
 return interaction.reply({ content: '​', flags: 64 });
    if (_img) embed.setImage(_img);
    channel.send({ embeds: [embed] });
}
