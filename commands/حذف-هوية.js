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

        if (!mention) return message.reply('❌ يجب ذكر اللاعب. مثال: `-حذف-هوية @اللاعب 1`');
        if (![1, 2, 3].includes(slot)) return message.reply('❌ رقم الهوية يجب أن يكون 1 أو 2 أو 3. مثال: `-حذف-هوية @اللاعب 2`');

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
        const msg = `❌ لا توجد هوية في الخانة **${slot}** للاعب **${targetUsername}**.`;
        if (interaction) return interaction.reply({ content: msg, flags: 64 });
        return channel.send(msg);
    }

    await db.deleteIdentity(targetId, slot);

    const embed = new EmbedBuilder()
        .setTitle('🗑️ تم حذف الهوية')
        .setColor(0x757575)
        .addFields(
            { name: '👤 اللاعب',       value: `<@${targetId}>`, inline: true },
            { name: '🔢 رقم الخانة',   value: `\`${slot}\``, inline: true },
            { name: '📛 اسم الشخصية', value: `\`${identity.character_name || 'غير محدد'} ${identity.family_name || ''}\``.trim(), inline: true },
        )
        .setFooter({ text: 'بوت FANTASY • نظام الهويات' })
        .setTimestamp();

    if (interaction) await interaction.channel.send({ embeds: [embed] });
 return interaction.reply({ content: '​', flags: 64 });
    channel.send({ embeds: [embed] });
}
