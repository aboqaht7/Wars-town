const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'إعداد-بانيك',
    data: new SlashCommandBuilder()
        .setName('إعداد-بانيك')
        .setDescription('تحديد الروم الذي تُرسل إليه طلبات الاستغاثة')
        .addChannelOption(o =>
            o.setName('الروم')
             .setDescription('الروم المراد استقبال طلبات البانيك فيه')
             .setRequired(true)
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ ليس لديك صلاحية.', flags: 64 });

        const channel = interaction.options.getChannel('الروم');
        await db.setConfig('panic_channel', channel.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ تم إعداد روم البانيك')
            .setColor(0x1B5E20)
            .setDescription(`سيتم إرسال طلبات الاستغاثة إلى <#${channel.id}>`)
            .setFooter({ text: 'إعداد البانيك • بوت FANTASY' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    },
};
