const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);

module.exports = {
    name: 'إعداد-بلاغات',
    data: new SlashCommandBuilder()
        .setName('إعداد-بلاغات')
        .setDescription('ضبط قنوات استقبال بلاغات الشرطة والإسعاف')
        .addSubcommand(s => s
            .setName('شرطة')
            .setDescription('حدد روم استقبال بلاغات الشرطة')
            .addChannelOption(o => o.setName('الروم').setDescription('الروم المراد إرسال البلاغات إليه').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('إسعاف')
            .setDescription('حدد روم استقبال بلاغات الإسعاف')
            .addChannelOption(o => o.setName('الروم').setDescription('الروم المراد إرسال البلاغات إليه').setRequired(true))
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ ليس لديك صلاحية.', flags: 64 });

        const sub     = interaction.options.getSubcommand();
        const channel = interaction.options.getChannel('الروم');

        if (sub === 'شرطة') {
            await db.setConfig('police_reports_channel', channel.id);
            const embed = new EmbedBuilder()
                .setTitle('✅ تم الإعداد')
                .setColor(0x1B5E20)
                .setDescription(`روم بلاغات الشرطة: <#${channel.id}>`)
                .setFooter({ text: 'إعداد البلاغات • بوت FANTASY' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetButton)] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'إسعاف') {
            await db.setConfig('ambulance_reports_channel', channel.id);
            const embed = new EmbedBuilder()
                .setTitle('✅ تم الإعداد')
                .setColor(0x1B5E20)
                .setDescription(`روم بلاغات الإسعاف: <#${channel.id}>`)
                .setFooter({ text: 'إعداد البلاغات • بوت FANTASY' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetButton)] });
            return interaction.reply({ content: '​', flags: 64 });
        }
    },
};
