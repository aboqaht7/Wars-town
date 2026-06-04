const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('Reset Menu').setEmoji({ id: '1479212270746599528', name: 'GL137', animated: true }).setStyle(ButtonStyle.Secondary);
const row = new ActionRowBuilder().addComponents(resetButton);

module.exports = {
    name: 'admin-give',
    data: new SlashCommandBuilder()
        .setName('admin-give')
        .setDescription('Admin commands: grant money or items to players')
        .addSubcommand(s => s
            .setName('اموال')
            .setDescription('Add money to a player character')
            .addUserOption(o => o.setName('اللاعب').setDescription('Choose the player').setRequired(true))
            .addIntegerOption(o => o.setName('المبلغ').setDescription('Amount in Riyals (negative to deduct)').setRequired(true))
            .addStringOption(o => o.setName('السبب').setDescription('Reason for addition (optional)').setRequired(false))
        )
        .addSubcommand(s => s
            .setName('غرض')
            .setDescription('Add an item to a player bag')
            .addUserOption(o => o.setName('اللاعب').setDescription('Choose the player').setRequired(true))
            .addStringOption(o => o.setName('الاسم').setDescription('Item name').setRequired(true))
            .addIntegerOption(o => o.setName('الكمية').setDescription('Quantity (default: 1)').setRequired(false).setMinValue(1).setMaxValue(999))
            .addStringOption(o => o.setName('السبب').setDescription('Reason for addition (optional)').setRequired(false))
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ You do not have permission.', flags: 64 });

        const sub    = interaction.options.getSubcommand();
        const target = interaction.options.getUser('اللاعب');
        const reason = interaction.options.getString('السبب') || 'No reason provided';

        if (sub === 'اموال') {
            const amount   = interaction.options.getInteger('المبلغ');

            await db.ensureUser(target.id, target.username);
            const identity = await db.getActiveIdentity(target.id);

            if (!identity)
                return interaction.reply({ content: `❌ **${target.username}** has no active character (not logged in).`, flags: 64 });

            const cashBefore = Number(identity.cash);
            await db.addToCash(target.id, identity.slot, amount);
            const cashAfter  = cashBefore + amount;

            const embed = new EmbedBuilder()
                .setTitle(amount >= 0 ? '💰 Money Added' : '💸 Money Deducted')
                .setColor(amount >= 0 ? 0x2E7D32 : 0xC62828)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: '👤 Player',                    value: `${target}`,                                          inline: true },
                    { name: '🆔 Character',                 value: identity.full_name || `Slot ${identity.slot}`,        inline: true },
                    { name: '\u200B',                       value: '\u200B',                                             inline: true },
                    { name: '💵 Before',                    value: `${cashBefore.toLocaleString()} Riyals`,              inline: true },
                    { name: amount >= 0 ? '➕ Added' : '➖ Deducted',
                                                            value: `${Math.abs(amount).toLocaleString()} Riyals`,        inline: true },
                    { name: '💵 After',                     value: `${cashAfter.toLocaleString()} Riyals`,               inline: true },
                    { name: '📝 Reason',                    value: reason,                                               inline: false },
                )
                .setFooter({ text: `By ${interaction.user.username} • FANTASY Bot` })
                .setTimestamp();

            await interaction.channel.send({ embeds: [embed], components: [row] });
            require('../loggers').logEvent(interaction.client, db, 'bank', embed).catch(() => {});
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'غرض') {
            const itemName = interaction.options.getString('الاسم').trim();
            const qty      = interaction.options.getInteger('الكمية') || 1;

            await db.ensureUser(target.id, target.username);
            await db.addItem(target.id, itemName, qty);

            const embed = new EmbedBuilder()
                .setTitle('Item Added to Inventory')
                .setColor(0xE53935)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: '👤 Player',  value: `${target}`,  inline: true },
                    { name: '📦 Item',    value: itemName,     inline: true },
                    { name: '🔢 Qty',     value: String(qty),  inline: true },
                    { name: '📝 Reason',  value: reason,       inline: false },
                )
                .setFooter({ text: `By ${interaction.user.username} • FANTASY Bot` })
                .setTimestamp();

            await interaction.channel.send({ embeds: [embed], components: [row] });
            require('../loggers').logEvent(interaction.client, db, 'admin', embed).catch(() => {});
            return interaction.reply({ content: '​', flags: 64 });
        }
    },
};
