const {
    SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits,
    ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder
} = require('discord.js');

module.exports = {
    name: 'إعداد-رحلات',
    data: new SlashCommandBuilder()
        .setName('إعداد-رحلات')
        .setDescription('Trip system setup')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('روم-البدء')
                .setDescription('Set the trip start announcements channel')
                .addChannelOption(o =>
                    o.setName('الروم').setDescription('The channel where trip start announcements are sent').setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('روم-التنبيهات')
                .setDescription('Set the alerts channel for trips (Hurricane / Renew)')
                .addChannelOption(o =>
                    o.setName('الروم').setDescription('The channel where trip alerts are sent').setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('رسالة')
                .setDescription('Set a custom text message for a specific event')
                .addStringOption(o =>
                    o.setName('الحدث')
                        .setDescription('The event you want to customize the message for')
                        .setRequired(true)
                        .addChoices(
                            { name: '🚀 Trip Start',   value: 'trip_start'    },
                            { name: '🌀 Hurricane',    value: 'trip_hurricane' },
                            { name: '🔄 Renew',        value: 'trip_renewal'  }
                        )
                )
        )
        .addSubcommand(sub =>
            sub.setName('معلومات')
                .setDescription('View current trip system settings')
        ),

    async slashExecute(interaction, db) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'روم-البدء') {
            const ch = interaction.options.getChannel('الروم');
            await db.setConfig('trips_start_channel', ch.id);
            const _img = await db.getImage('events').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Trip Start Channel Set')
                .setColor(0x1565C0)
                .addFields({ name: '📢 Channel', value: `<#${ch.id}>`, inline: true })
                .setFooter({ text: 'Trip System • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'روم-التنبيهات') {
            const ch = interaction.options.getChannel('الروم');
            await db.setConfig('trips_alerts_channel', ch.id);
            const _img = await db.getImage('events').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Trip Alerts Channel Set')
                .setColor(0x1565C0)
                .addFields({ name: '📢 Channel', value: `<#${ch.id}>`, inline: true })
                .setFooter({ text: 'Trip System • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'رسالة') {
            const type   = interaction.options.getString('الحدث');
            const labels = { trip_start: 'Trip Start', trip_hurricane: 'Hurricane', trip_renewal: 'Renew' };
            const { ButtonBuilder, ButtonStyle } = require('discord.js');
            const btn = new ButtonBuilder()
                .setCustomId(`trip_msg_btn_${type}`)
                .setLabel(`Write ${labels[type]} message`).setEmoji('✏️')
                .setStyle(ButtonStyle.Primary);
            const row = new ActionRowBuilder().addComponents(btn);
            await interaction.channel.send({
                content: `<@${interaction.user.id}> Press the button to write a custom **${labels[type]}** message:`,
                components: [row]
            });
            return interaction.reply({ content: '\u200b', flags: 64 });
        }

        if (sub === 'معلومات') {
            const startCh   = await db.getConfig('trips_start_channel');
            const alertsCh  = await db.getConfig('trips_alerts_channel');
            const msgStart   = await db.getConfig('trip_start_message');
            const msgHurr    = await db.getConfig('trip_hurricane_message');
            const msgRenew   = await db.getConfig('trip_renewal_message');

            const _img = await db.getImage('events').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Trip System Settings')
                .setColor(0x37474F)
                .addFields(
                    { name: '📢 Start Channel',      value: startCh  ? `<#${startCh}>`  : '❌ Not set', inline: true },
                    { name: '📢 Alerts Channel',     value: alertsCh ? `<#${alertsCh}>` : '❌ Not set', inline: true },
                    { name: '🚀 Trip Start Message', value: msgStart  ? '✅ Custom'  : '⬜ Default', inline: true },
                    { name: '🌀 Hurricane Message',  value: msgHurr   ? '✅ Custom'  : '⬜ Default', inline: true },
                    { name: '🔄 Renew Message',      value: msgRenew  ? '✅ Custom'  : '⬜ Default', inline: true },
                )
                .setFooter({ text: 'Trip System • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }
    }
};
