const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('Reset Menu').setEmoji({ id: '1479212270746599528', name: 'GL137', animated: true }).setStyle(ButtonStyle.Secondary);

module.exports = {
    name: 'إعداد-بلاغات',
    data: new SlashCommandBuilder()
        .setName('إعداد-بلاغات')
        .setDescription('Set the channels for police and ambulance reports')
        .addSubcommand(s => s
            .setName('شرطة')
            .setDescription('Set the police reports channel')
            .addChannelOption(o => o.setName('الروم').setDescription('The channel to receive police reports').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('إسعاف')
            .setDescription('Set the ambulance reports channel')
            .addChannelOption(o => o.setName('الروم').setDescription('The channel to receive ambulance reports').setRequired(true))
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ You do not have permission.', flags: 64 });

        const sub     = interaction.options.getSubcommand();
        const channel = interaction.options.getChannel('الروم');

        if (sub === 'شرطة') {
            await db.setConfig('police_reports_channel', channel.id);
            const _img = await db.getImage('admin').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Setup Complete')
                .setColor(0x1B5E20)
                .setDescription(`Police reports channel: <#${channel.id}>`)
                .setFooter({ text: 'Reports Setup • FANTASY Bot' })
                .setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetButton)] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'إسعاف') {
            await db.setConfig('ambulance_reports_channel', channel.id);
            const _img = await db.getImage('admin').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Setup Complete')
                .setColor(0x1B5E20)
                .setDescription(`Ambulance reports channel: <#${channel.id}>`)
                .setFooter({ text: 'Reports Setup • FANTASY Bot' })
                .setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetButton)] });
            return interaction.reply({ content: '​', flags: 64 });
        }
    },
};
