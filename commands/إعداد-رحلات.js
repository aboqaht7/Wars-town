const {
    SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits,
    ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder
} = require('discord.js');

module.exports = {
    name: 'إعداد-رحلات',
    data: new SlashCommandBuilder()
        .setName('إعداد-رحلات')
        .setDescription('إعداد نظام الرحلات')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('روم-البدء')
                .setDescription('تعيين روم إعلانات بدء الرحلة')
                .addChannelOption(o =>
                    o.setName('الروم').setDescription('الروم الذي تُرسل فيه إعلانات بدء الرحلة').setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('روم-التنبيهات')
                .setDescription('تعيين روم تنبيهات الرحلة (إعصار / تجديد)')
                .addChannelOption(o =>
                    o.setName('الروم').setDescription('الروم الذي تُرسل فيه تنبيهات الرحلة').setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('رسالة')
                .setDescription('تعيين رسالة نصية مخصصة لحدث معين')
                .addStringOption(o =>
                    o.setName('الحدث')
                        .setDescription('الحدث الذي تريد تخصيص رسالته')
                        .setRequired(true)
                        .addChoices(
                            { name: '🚀 بدء الرحلة',  value: 'trip_start'    },
                            { name: '🌀 الإعصار',      value: 'trip_hurricane' },
                            { name: '🔄 التجديد',      value: 'trip_renewal'  }
                        )
                )
        )
        .addSubcommand(sub =>
            sub.setName('معلومات')
                .setDescription('عرض الإعدادات الحالية لنظام الرحلات')
        ),

    async slashExecute(interaction, db) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'روم-البدء') {
            const ch = interaction.options.getChannel('الروم');
            await db.setConfig('trips_start_channel', ch.id);
            const embed = new EmbedBuilder()
                .setTitle('✅ تم تعيين روم بدء الرحلة')
                .setColor(0x1565C0)
                .addFields({ name: '📢 الروم', value: `<#${ch.id}>`, inline: true })
                .setFooter({ text: 'نظام الرحلات • بوت FANTASY' }).setTimestamp();
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'روم-التنبيهات') {
            const ch = interaction.options.getChannel('الروم');
            await db.setConfig('trips_alerts_channel', ch.id);
            const embed = new EmbedBuilder()
                .setTitle('✅ تم تعيين روم تنبيهات الرحلة')
                .setColor(0x1565C0)
                .addFields({ name: '📢 الروم', value: `<#${ch.id}>`, inline: true })
                .setFooter({ text: 'نظام الرحلات • بوت FANTASY' }).setTimestamp();
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'رسالة') {
            const type   = interaction.options.getString('الحدث');
            const labels = { trip_start: 'بدء الرحلة', trip_hurricane: 'الإعصار', trip_renewal: 'التجديد' };
            const { ButtonBuilder, ButtonStyle } = require('discord.js');
            const btn = new ButtonBuilder()
                .setCustomId(`trip_msg_btn_${type}`)
                .setLabel(`✏️ اكتب رسالة ${labels[type]}`)
                .setStyle(ButtonStyle.Primary);
            const row = new ActionRowBuilder().addComponents(btn);
            await interaction.channel.send({
                content: `<@${interaction.user.id}> اضغط الزر لكتابة رسالة **${labels[type]}** المخصصة:`,
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

            const embed = new EmbedBuilder()
                .setTitle('⚙️ إعدادات نظام الرحلات')
                .setColor(0x37474F)
                .addFields(
                    { name: '📢 روم البدء',       value: startCh  ? `<#${startCh}>`  : '❌ غير مُعيَّن', inline: true },
                    { name: '📢 روم التنبيهات',    value: alertsCh ? `<#${alertsCh}>` : '❌ غير مُعيَّن', inline: true },
                    { name: '🚀 رسالة بدء الرحلة', value: msgStart   ? '✅ مخصصة'  : '⬜ افتراضية', inline: true },
                    { name: '🌀 رسالة الإعصار',    value: msgHurr    ? '✅ مخصصة'  : '⬜ افتراضية', inline: true },
                    { name: '🔄 رسالة التجديد',    value: msgRenew   ? '✅ مخصصة'  : '⬜ افتراضية', inline: true },
                )
                .setFooter({ text: 'نظام الرحلات • بوت FANTASY' }).setTimestamp();
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }
    }
};
