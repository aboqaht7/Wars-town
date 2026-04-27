const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('Reset Menu').setEmoji('🔄').setStyle(ButtonStyle.Secondary);

module.exports = {
    name: 'إدارة-متجر',
    data: new SlashCommandBuilder()
        .setName('إدارة-متجر')
        .setDescription('Manage store items')
        .addSubcommand(s => s
            .setName('اضافة')
            .setDescription('Add an item to the store')
            .addStringOption(o => o.setName('الاسم').setDescription('Item name').setRequired(true))
            .addIntegerOption(o => o.setName('السعر').setDescription('Price in Riyals').setRequired(true).setMinValue(1))
            .addStringOption(o => o.setName('الوصف').setDescription('Item description (optional)').setRequired(false))
        )
        .addSubcommand(s => s
            .setName('حذف')
            .setDescription('Delete an item by ID')
            .addIntegerOption(o => o.setName('id').setDescription('Item ID').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('حذف-الكل')
            .setDescription('Delete all store items')
        )
        .addSubcommand(s => s
            .setName('تعديل')
            .setDescription('Edit an item by ID')
            .addIntegerOption(o => o.setName('id').setDescription('Item ID').setRequired(true))
            .addStringOption(o => o.setName('الاسم').setDescription('New name').setRequired(false))
            .addIntegerOption(o => o.setName('السعر').setDescription('New price in Riyals').setRequired(false).setMinValue(1))
            .addStringOption(o => o.setName('الوصف').setDescription('New description').setRequired(false))
        )
        .addSubcommand(s => s
            .setName('قائمة')
            .setDescription('View all store items')
        )
        .addSubcommand(s => s
            .setName('عرض')
            .setDescription('Send the store embed in the current channel')
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ You do not have permission.', flags: 64 });

        const sub = interaction.options.getSubcommand();
        const row = new ActionRowBuilder().addComponents(resetButton);

        if (sub === 'اضافة') {
            const name  = interaction.options.getString('الاسم').trim();
            const price = interaction.options.getInteger('السعر');
            const desc  = interaction.options.getString('الوصف')?.trim() || null;
            const item  = await db.addMarketItem(name, price, desc);
            const _img = await db.getImage('market').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Added to Store')
                .setColor(0xBF360C)
                .addFields(
                    { name: 'ID',          value: String(item.id),                                inline: true },
                    { name: 'Name',        value: item.name,                                      inline: true },
                    { name: 'Price',       value: `${Number(item.price).toLocaleString()} Riyals`, inline: true },
                    { name: 'Description', value: item.description || '—',                        inline: false },
                )
                .setFooter({ text: 'Store Admin • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'حذف') {
            const id   = interaction.options.getInteger('id');
            const item = await db.getMarketItemById(id);
            if (!item) return interaction.reply({ content: `❌ No item found with ID: ${id}`, flags: 64 });
            await db.deleteMarketItem(id);
            return interaction.reply({ content: `✅ **${item.name}** deleted successfully.`, flags: 64 });
        }

        if (sub === 'حذف-الكل') {
            await db.deleteAllMarketItems();
            return interaction.reply({ content: '✅ All store items deleted.', flags: 64 });
        }

        if (sub === 'تعديل') {
            const id    = interaction.options.getInteger('id');
            const name  = interaction.options.getString('الاسم')?.trim();
            const price = interaction.options.getInteger('السعر') || undefined;
            const desc  = interaction.options.getString('الوصف')?.trim();
            if (!name && !price && desc === undefined)
                return interaction.reply({ content: '❌ At least one field must be specified for editing.', flags: 64 });
            const item = await db.updateMarketItem(id, {
                ...(name  ? { name }  : {}),
                ...(price ? { price } : {}),
                ...(desc !== undefined ? { description: desc || null } : {}),
            });
            if (!item) return interaction.reply({ content: `❌ No item found with ID: ${id}`, flags: 64 });
            const _img = await db.getImage('market').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Item Updated')
                .setColor(0xBF360C)
                .addFields(
                    { name: 'ID',          value: String(item.id),                               inline: true },
                    { name: 'Name',        value: item.name,                                     inline: true },
                    { name: 'Price',       value: `${Number(item.price).toLocaleString()} Riyals`, inline: true },
                    { name: 'Description', value: item.description || '—',                       inline: false },
                )
                .setFooter({ text: 'Store Admin • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'قائمة') {
            const items = await db.getMarketItems();
            const _img = await db.getImage('market').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Store List')
                .setColor(0xBF360C)
                .setFooter({ text: 'Store Admin • FANTASY Bot' }).setTimestamp();
            if (!items.length) {
                embed.setDescription('No items added yet.');
            } else {
                embed.setDescription(
                    items.map(it =>
                        `**ID ${it.id}** • ${it.name} — **${Number(it.price).toLocaleString()} Riyals**` +
                        (it.description ? `\n> ${it.description}` : '')
                    ).join('\n')
                );
            }
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'عرض') {
            const market = require('./Market');
            const payload = await market.buildMarket(db);
            await interaction.reply({ content: '✅ Store embed sent.', flags: 64 });
            return interaction.channel.send(payload);
        }
    },
};
