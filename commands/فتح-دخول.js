const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'فتح-دخول',
    data: new SlashCommandBuilder()
        .setName('فتح-دخول')
        .setDescription('فتح أو إغلاق تسجيل الدخول يدوياً')
        .addSubcommand(s => s
            .setName('فتح')
            .setDescription('تفعيل تسجيل الدخول للاعبين')
        )
        .addSubcommand(s => s
            .setName('إغلاق')
            .setDescription('إيقاف تسجيل الدخول للاعبين')
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ ليس لديك صلاحية.', flags: 64 });

        const sub = interaction.options.getSubcommand();

        if (sub === 'فتح') {
            await db.setConfig('trip_open', 'true');
            await db.setConfig('hurricane_active', 'false');
            const embed = new EmbedBuilder()
                .setTitle('✅ تم فتح تسجيل الدخول')
                .setColor(0x1B5E20)
                .setDescription('يمكن للاعبين الآن تسجيل الدخول.')
                .setFooter({ text: 'نظام الدخول • بوت FANTASY' })
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'إغلاق') {
            await db.setConfig('trip_open', 'false');
            const embed = new EmbedBuilder()
                .setTitle('🔒 تم إغلاق تسجيل الدخول')
                .setColor(0xB71C1C)
                .setDescription('تسجيل الدخول متوقف الآن.')
                .setFooter({ text: 'نظام الدخول • بوت FANTASY' })
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }
    },
};
