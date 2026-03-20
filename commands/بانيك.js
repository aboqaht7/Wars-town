const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'بانيك',
    data: new SlashCommandBuilder()
        .setName('بانيك')
        .setDescription('إرسال إمبيد نداء الاستغاثة في هذا الروم'),

    async slashExecute(interaction, db) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ ليس لديك صلاحية.', flags: 64 });

        const panicChannel = await db.getConfig('panic_channel');
        if (!panicChannel)
            return interaction.reply({ content: '❌ لم يتم تحديد روم الاستغاثة بعد. استخدم `/إعداد-بانيك` أولاً.', flags: 64 });

        const embed = new EmbedBuilder()
            .setTitle('🆘 نداء استغاثة — بانيك')
            .setColor(0xD32F2F)
            .setDescription(
                '**أنت في خطر؟**\n\n' +
                'اضغط على الزر أدناه، أدخل موقعك، وسيصل طلب الاستغاثة فوراً للجهات المختصة.\n\n' +
                '> ⚠️ يُستخدم هذا النظام في الحالات الطارئة فقط.'
            )
            .setFooter({ text: 'نظام الاستغاثة • بوت FANTASY' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('panic_location_btn')
                .setLabel('📍 إرسال الموقع')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        return interaction.reply({ content: '✅ تم إرسال إمبيد البانيك.', flags: 64 });
    },
};
