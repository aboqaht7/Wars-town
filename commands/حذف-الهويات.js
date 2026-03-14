const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'حذف-الهويات',

    async execute(message, args, db) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ هذا الأمر للمسؤولين فقط.');
        }

        const embed = new EmbedBuilder()
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

        message.channel.send({ embeds: [embed], components: [row] });
    }
};
