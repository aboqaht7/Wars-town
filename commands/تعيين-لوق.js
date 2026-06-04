const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { LOG_TYPES } = require('../loggers');

module.exports = {
    name: 'تعيين-لوق',
    data: new SlashCommandBuilder()
        .setName('تعيين-لوق')
        .setDescription('تعيين روم تسجيل عمليات البوت (باند، إعدادات، نسخ احتياطية، عام)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt =>
            opt.setName('النوع')
                .setDescription('نوع اللوق')
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
                )
        )
        .addChannelOption(opt =>
            opt.setName('الروم')
                .setDescription('الروم المراد إرسال اللوقات إليه')
                .setRequired(true)
        ),

    async slashExecute(interaction, db) {
        const type    = interaction.options.getString('النوع');
        const channel = interaction.options.getChannel('الروم');
        const meta    = LOG_TYPES[type];
        if (!meta) return interaction.reply({ content: 'نوع غير معروف.', flags: 64 });

        await db.setConfig(meta.key, channel.id);

        const embed = new EmbedBuilder()
            .setTitle('تم تعيين روم اللوق')
            .setColor(0xE53935)
            .addFields(
                { name: 'النوع',  value: meta.label,        inline: true },
                { name: 'الروم',  value: `<#${channel.id}>`, inline: true },
                { name: 'المنفذ', value: `${interaction.user}`, inline: true },
            )
            .setFooter({ text: 'نظام اللوقات • FANTASY Bot' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};
