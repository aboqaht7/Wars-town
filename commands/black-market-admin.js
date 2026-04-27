const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('Reset Menu').setEmoji('🔄').setStyle(ButtonStyle.Secondary);

module.exports = {
    name: 'إدارة-بلاك-ماركت',
    data: new SlashCommandBuilder()
        .setName('إدارة-بلاك-ماركت')
        .setDescription('Manage Black Market items')
        .addSubcommand(s => s
            .setName('اضافة')
            .setDescription('Add a new item')
            .addStringOption(o => o.setName('الاسم').setDescription('Item name').setRequired(true))
            .addIntegerOption(o => o.setName('السعر').setDescription('Price in dollars').setRequired(true).setMinValue(1))
        )
        .addSubcommand(s => s
            .setName('حذف')
            .setDescription('Delete an item by ID')
            .addIntegerOption(o => o.setName('id').setDescription('Item ID').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('حذف-الكل')
            .setDescription('Delete all Black Market items')
        )
        .addSubcommand(s => s
            .setName('تعديل')
            .setDescription('Edit an item by ID')
            .addIntegerOption(o => o.setName('id').setDescription('Item ID').setRequired(true))
            .addStringOption(o => o.setName('الاسم').setDescription('New name').setRequired(false))
            .addIntegerOption(o => o.setName('السعر').setDescription('New price').setRequired(false).setMinValue(1))
        )
        .addSubcommand(s => s
            .setName('قائمة')
            .setDescription('View all Black Market items')
        )
        .addSubcommand(s => s
            .setName('عرض')
            .setDescription('Send the Black Market embed in the current channel')
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ You do not have permission.', flags: 64 });

        const sub = interaction.options.getSubcommand();

        if (sub === 'اضافة') {
            const name  = interaction.options.getString('الاسم').trim();
            const price = interaction.options.getInteger('السعر');
            const item  = await db.addBlackMarketItem(name, price);
            const _img = await db.getImage('بلاك ماركت').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Item Added')
                .setColor(0x1a1a2e)
                .addFields(
                    { name: 'ID',    value: String(item.id),                              inline: true },
                    { name: 'Name',  value: item.name,                                    inline: true },
                    { name: 'Price', value: `${Number(item.price).toLocaleString('en-US')}$`, inline: true },
                )
                .setFooter({ text: 'Black Market Admin • FANTASY Bot' })
                .setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetButton)] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'حذف') {
            const id   = interaction.options.getInteger('id');
            const item = await db.getBlackMarketItemById(id);
            if (!item) return interaction.reply({ content: `❌ No item found with ID: ${id}`, flags: 64 });
            await db.deleteBlackMarketItem(id);
            return interaction.reply({ content: `✅ **${item.name}** deleted successfully.`, flags: 64 });
        }

        if (sub === 'حذف-الكل') {
            await db.deleteAllBlackMarketItems();
            return interaction.reply({ content: '✅ All Black Market items deleted.', flags: 64 });
        }

        if (sub === 'تعديل') {
            const id    = interaction.options.getInteger('id');
            const name  = interaction.options.getString('الاسم') || undefined;
            const price = interaction.options.getInteger('السعر') || undefined;
            if (!name && !price) return interaction.reply({ content: '❌ Specify a name or price to edit.', flags: 64 });
            const item = await db.updateBlackMarketItem(id, { name, price });
            if (!item) return interaction.reply({ content: `❌ No item found with ID: ${id}`, flags: 64 });
            const _img = await db.getImage('بلاك ماركت').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Item Updated')
                .setColor(0x1a1a2e)
                .addFields(
                    { name: 'ID',    value: String(item.id),                              inline: true },
                    { name: 'Name',  value: item.name,                                    inline: true },
                    { name: 'Price', value: `${Number(item.price).toLocaleString('en-US')}$`, inline: true },
                )
                .setFooter({ text: 'Black Market Admin • FANTASY Bot' })
                .setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetButton)] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'قائمة') {
            const items = await db.getBlackMarketItems();
            const _img = await db.getImage('بلاك ماركت').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Black Market List')
                .setColor(0x1a1a2e)
                .setFooter({ text: 'Black Market Admin • FANTASY Bot' })
                .setTimestamp();
            if (!items.length) {
                embed.setDescription('No items added yet.');
            } else {
                embed.setDescription(
                    items.map(it => `**ID ${it.id}** • ${it.name} — **${Number(it.price).toLocaleString('en-US')}$**`).join('\n')
                );
            }
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetButton)] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'عرض') {
            const blackMarket = require('./black-market');
            const payload = await blackMarket.buildPublic();
            await interaction.reply({ content: '✅ Black Market embed sent.', flags: 64 });
            return interaction.channel.send(payload);
        }
    },
};
