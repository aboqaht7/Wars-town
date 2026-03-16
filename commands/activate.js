const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

module.exports = {
    name: 'تفعيل',
    data: new SlashCommandBuilder()
        .setName('تفعيل')
        .setDescription('إرسال لوحة تفعيل الحسابات'),

    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('🎮 نظام تفعيل الحسابات')
            .setColor(0x1565C0)
            .setDescription(
                '**مرحباً بك في نظام التفعيل!**\n\n' +
                'لتفعيل حسابك في السيرفر اتبع الخطوات التالية:\n\n' +
                '**1️⃣** اختر **تفعيل** من القائمة أدناه\n' +
                '**2️⃣** أدخل **ID سوني (PSN)** الخاص بك\n' +
                '**3️⃣** انتظر موافقة الإدارة\n\n' +
                '> ⚠️ تأكد من إدخال الـ ID بشكل صحيح'
            )
            .setFooter({ text: 'نظام التفعيل • بوت FANTASY' })
            .setTimestamp();

        const menu = new StringSelectMenuBuilder()
            .setCustomId('activation_menu')
            .setPlaceholder('اختر من هنا...')
            .addOptions({ label: '🎮 تفعيل', description: 'ادخل ID سوني الخاص بك للتفعيل', value: 'activate_now' });

        const resetBtn = new ButtonBuilder()
            .setCustomId('reset_menu')
            .setLabel('🔄 Reset Menu')
            .setStyle(ButtonStyle.Secondary);

        const main = {
            embeds: [embed],
            components: [
                new ActionRowBuilder().addComponents(menu),
                new ActionRowBuilder().addComponents(resetBtn),
            ],
        };

        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        return interaction.reply({ content: '​', flags: 64 });
    },
};
