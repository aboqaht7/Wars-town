const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
const row = new ActionRowBuilder().addComponents(resetButton);

module.exports = {
    name: 'admin-give',
    data: new SlashCommandBuilder()
        .setName('admin-give')
        .setDescription('أوامر إدارية: منح أموال أو أغراض للاعبين')
        .addSubcommand(s => s
            .setName('اموال')
            .setDescription('أضف أموالاً لشخصية لاعب')
            .addUserOption(o => o.setName('اللاعب').setDescription('اختر اللاعب').setRequired(true))
            .addIntegerOption(o => o.setName('المبلغ').setDescription('المبلغ بالريال (يمكن أن يكون سالباً لخصم أموال)').setRequired(true))
            .addStringOption(o => o.setName('السبب').setDescription('سبب الإضافة (اختياري)').setRequired(false))
        )
        .addSubcommand(s => s
            .setName('غرض')
            .setDescription('أضف غرضاً لحقيبة لاعب')
            .addUserOption(o => o.setName('اللاعب').setDescription('اختر اللاعب').setRequired(true))
            .addStringOption(o => o.setName('الاسم').setDescription('اسم الغرض').setRequired(true))
            .addIntegerOption(o => o.setName('الكمية').setDescription('الكمية (افتراضي: 1)').setRequired(false).setMinValue(1).setMaxValue(999))
            .addStringOption(o => o.setName('السبب').setDescription('سبب الإضافة (اختياري)').setRequired(false))
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ ليس لديك صلاحية.', flags: 64 });

        const sub    = interaction.options.getSubcommand();
        const target = interaction.options.getUser('اللاعب');
        const reason = interaction.options.getString('السبب') || 'لا يوجد سبب';

        if (sub === 'اموال') {
            const amount   = interaction.options.getInteger('المبلغ');

            await db.ensureUser(target.id, target.username);
            const identity = await db.getActiveIdentity(target.id);

            if (!identity)
                return interaction.reply({ content: `❌ **${target.username}** ليس لديه شخصية نشطة (لم يسجل دخول).`, flags: 64 });

            const cashBefore = Number(identity.cash);
            await db.addToCash(target.id, identity.slot, amount);
            const cashAfter  = cashBefore + amount;

            const embed = new EmbedBuilder()
                .setTitle(amount >= 0 ? '💰 تمت إضافة أموال' : '💸 تم خصم أموال')
                .setColor(amount >= 0 ? 0x2E7D32 : 0xC62828)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: '👤 اللاعب',         value: `${target}`,                                           inline: true },
                    { name: '🆔 الشخصية',         value: identity.full_name || `Slot ${identity.slot}`,        inline: true },
                    { name: '\u200B',              value: '\u200B',                                              inline: true },
                    { name: '💵 قبل',             value: `${cashBefore.toLocaleString()} ريال`,                inline: true },
                    { name: amount >= 0 ? '➕ المضاف' : '➖ المخصوم',
                                                   value: `${Math.abs(amount).toLocaleString()} ريال`,          inline: true },
                    { name: '💵 بعد',             value: `${cashAfter.toLocaleString()} ريال`,                 inline: true },
                    { name: '📝 السبب',           value: reason,                                                inline: false },
                )
                .setFooter({ text: `بواسطة ${interaction.user.username} • بوت FANTASY` })
                .setTimestamp();

            await interaction.channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'غرض') {
            const itemName = interaction.options.getString('الاسم').trim();
            const qty      = interaction.options.getInteger('الكمية') || 1;

            await db.ensureUser(target.id, target.username);
            await db.addItem(target.id, itemName, qty);

            const embed = new EmbedBuilder()
                .setTitle('🎒 تمت إضافة غرض للحقيبة')
                .setColor(0x1565C0)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: '👤 اللاعب',  value: `${target}`,                    inline: true },
                    { name: '📦 الغرض',   value: itemName,                        inline: true },
                    { name: '🔢 الكمية',  value: String(qty),                     inline: true },
                    { name: '📝 السبب',   value: reason,                          inline: false },
                )
                .setFooter({ text: `بواسطة ${interaction.user.username} • بوت FANTASY` })
                .setTimestamp();

            await interaction.channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '​', flags: 64 });
        }
    },
};
