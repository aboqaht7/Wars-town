const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'حذف-الهويات',

    async execute(message, args, db) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ هذا الأمر للمسؤولين فقط.');
        }

        const confirmEmbed = new EmbedBuilder()
            .setTitle('⚠️ تأكيد الحذف الكامل')
            .setColor(0xB71C1C)
            .setDescription(
                '> هل أنت متأكد من **حذف جميع الهويات**؟\n\n' +
                '⚠️ هذا الإجراء **لا يمكن التراجع عنه**.\n' +
                'سيتم حذف جميع الهويات وتسجيل الخروج من جميع الحسابات وحذف جميع الطلبات المعلقة.'
            )
            .setFooter({ text: 'بوت FANTASY • نظام الهويات' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_delete_all_identities').setLabel('تأكيد الحذف').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('cancel_delete_all_identities').setLabel('إلغاء').setStyle(ButtonStyle.Secondary),
        );

        const msg = await message.channel.send({ embeds: [confirmEmbed], components: [row] });

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 30_000,
            max: 1,
        });

        collector.on('collect', async i => {
            if (i.customId === 'confirm_delete_all_identities') {
                await db.deleteAllIdentities();
                const doneEmbed = new EmbedBuilder()
                    .setTitle('🗑️ تم حذف جميع الهويات')
                    .setColor(0x757575)
                    .setDescription('> تم حذف جميع الهويات والطلبات المعلقة بنجاح، وتم تسجيل الخروج من جميع الحسابات.')
                    .setFooter({ text: 'بوت FANTASY • نظام الهويات' })
                    .setTimestamp();
                await i.update({ embeds: [doneEmbed], components: [] });
            } else {
                await i.update({ content: '❌ تم إلغاء العملية.', embeds: [], components: [] });
            }
        });

        collector.on('end', collected => {
            if (!collected.size) {
                msg.edit({ content: '⏰ انتهى وقت التأكيد.', embeds: [], components: [] }).catch(() => {});
            }
        });
    }
};
