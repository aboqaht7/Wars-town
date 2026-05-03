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
            return interaction.reply({ content: '❌ You do not have permission.', flags: 64 });

        const channel = interaction.options.getChannel('الروم');
        await db.setConfig('panic_channel', channel.id);

        const _img = await db.getImage('admin').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Panic Room Configured')
            .setColor(0xE53935)
            .setDescription(`Distress calls will be sent to <#${channel.id}>`)
            .setFooter({ text: 'Panic Setup • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);

        await interaction.reply({ embeds: [embed], flags: 64 });
    },
};
