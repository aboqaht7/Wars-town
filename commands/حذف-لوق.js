const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { LOG_TYPES } = require('../loggers');

module.exports = {
    name: 'حذف-لوق',
    data: new SlashCommandBuilder()
        .setName('حذف-لوق')
        .setDescription('إزالة تعيين روم لوق معيّن')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt =>
            opt.setName('النوع')
                .setDescription('نوع اللوق المراد إزالته')
                .setRequired(true)
                .addChoices(
                    { name: 'باند والطرد',           value: 'band' },
                    { name: 'إعدادات الإدارة',        value: 'config' },
                    { name: 'نسخ احتياطية',           value: 'backup' },
                    { name: 'تراكينق CIA',            value: 'tracking' },
                    { name: 'تكتات',                  value: 'ticket' },
                    { name: 'هويات',                  value: 'identity' },
                    { name: 'مركبات',                 value: 'vehicle' },
                    { name: 'بنك ومعاملات',           value: 'bank' },
                    { name: 'شرطة (كلبشة / سرقة)',   value: 'police' },
                    { name: 'عقارات',                 value: 'property' },
                    { name: 'ماركت ونقل',             value: 'market' },
                    { name: 'أوامر الأدمن',           value: 'admin' },
                    { name: 'عام (احتياطي)',          value: 'general' },
                    { name: 'رفع GitHub',             value: 'github_push' },
                )
        ),

    async slashExecute(interaction, db) {
        const type = interaction.options.getString('النوع');
        const meta = LOG_TYPES[type];
        if (!meta) return interaction.reply({ content: 'نوع غير معروف.', flags: 64 });

        const existing = await db.getConfig(meta.key).catch(() => null);

        await db.deleteConfig(meta.key);

        const embed = new EmbedBuilder()
            .setTitle('تم حذف تعيين روم اللوق')
            .setColor(0xB71C1C)
            .addFields(
                { name: 'النوع',       value: meta.label,                                     inline: true },
                { name: 'الروم السابق', value: existing ? `<#${existing}>` : '_لم يكن معيّناً_', inline: true },
                { name: 'المنفذ',      value: `${interaction.user}`,                           inline: true },
            )
            .setDescription('سيظهر هذا اللوق الآن كـ **غير معيّن** في `/عرض-لوقات`.')
            .setFooter({ text: 'نظام اللوقات • FANTASY Bot' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};
