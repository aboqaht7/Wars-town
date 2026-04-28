const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('Reset Menu').setEmoji({ id: '1479212270746599528', name: 'GL137', animated: true }).setStyle(ButtonStyle.Secondary);

module.exports = {
    name: 'إدارة-معدات',
    data: new SlashCommandBuilder()
        .setName('إدارة-معدات')
        .setDescription('Manage equipment store items')
        .addSubcommand(s => s
            .setName('اضافة')
            .setDescription('Add equipment to the store')
            .addStringOption(o => o.setName('الاسم').setDescription('Equipment name').setRequired(true))
            .addIntegerOption(o => o.setName('السعر').setDescription('Price in Riyals').setRequired(true).setMinValue(1))
            .addStringOption(o => o.setName('الوصف').setDescription('Equipment description (optional)').setRequired(false))
        )
        .addSubcommand(s => s
            .setName('حذف')
            .setDescription('Delete equipment by ID')
            .addIntegerOption(o => o.setName('id').setDescription('Equipment ID').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('حذف-الكل')
            .setDescription('Delete all equipment')
        )
        .addSubcommand(s => s
            .setName('تعديل')
            .setDescription('Edit equipment by ID')
            .addIntegerOption(o => o.setName('id').setDescription('Equipment ID').setRequired(true))
            .addStringOption(o => o.setName('الاسم').setDescription('New name').setRequired(false))
            .addIntegerOption(o => o.setName('السعر').setDescription('New price').setRequired(false).setMinValue(1))
            .addStringOption(o => o.setName('الوصف').setDescription('New description').setRequired(false))
        )
        .addSubcommand(s => s
            .setName('قائمة')
            .setDescription('View all equipment')
        )
        .addSubcommand(s => s
            .setName('عرض')
            .setDescription('Send the equipment store embed in the current channel')
        ),

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
            return message.reply('❌ You do not have permission.');

        const sub = args[0];
        const row = new ActionRowBuilder().addComponents(resetButton);

        if (sub === 'اضافة') {
            const rest = args.slice(1).join(' ');
            const parts = rest.split('|').map(p => p.trim());
            const name  = parts[0];
            const price = parseInt(parts[1]);
            const desc  = parts[2] || null;
            if (!name || isNaN(price) || price < 1)
                return message.reply('❌ Usage:\n`-إدارة-معدات اضافة Name | Price | Description (optional)`');
            const item = await db.addEquipmentItem(name, price, desc);
            const _img = await db.getImage('معدات').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Equipment Added')
                .setColor(0x4527A0)
                .addFields(
                    { name: 'ID',          value: String(item.id),                               inline: true },
                    { name: 'Name',        value: item.name,                                     inline: true },
                    { name: 'Price',       value: `${Number(item.price).toLocaleString()} Riyals`, inline: true },
                    { name: 'Description', value: item.description || '—',                       inline: false },
                )
                .setFooter({ text: 'Equipment Admin • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            return message.channel.send({ embeds: [embed], components: [row] });
        }

        if (sub === 'حذف') {
            const id   = parseInt(args[1]);
            if (isNaN(id)) return message.reply('❌ Usage: `-إدارة-معدات حذف [ID]`');
            const item = await db.getEquipmentItemById(id);
            if (!item) return message.reply(`❌ No equipment found with ID: ${id}`);
            await db.deleteEquipmentItem(id);
            return message.reply(`✅ **${item.name}** deleted successfully.`);
        }

        if (sub === 'حذف-الكل') {
            await db.deleteAllEquipmentItems();
            return message.reply('✅ All equipment deleted.');
        }

        if (sub === 'قائمة') {
            const items = await db.getEquipmentItems();
            const _img = await db.getImage('معدات').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Equipment List')
                .setColor(0x4527A0)
                .setFooter({ text: 'Equipment Admin • FANTASY Bot' }).setTimestamp();
            if (!items.length) {
                embed.setDescription('No equipment added yet.');
            } else {
                embed.setDescription(
                    items.map(it =>
                        `**ID ${it.id}** • ${it.name} — **${Number(it.price).toLocaleString()} Riyals**` +
                        (it.description ? `\n> ${it.description}` : '')
                    ).join('\n')
                );
            }
            if (_img) embed.setImage(_img);
            return message.channel.send({ embeds: [embed], components: [row] });
        }

        if (sub === 'عرض') {
            const eq = require('./equipment');
            const payload = await eq.buildEquipment(db);
            return message.channel.send(payload);
        }

        return message.reply(
            '**Equipment Admin Commands:**\n' +
            '`-إدارة-معدات اضافة Name | Price | Description`\n' +
            '`-إدارة-معدات حذف [ID]`\n' +
            '`-إدارة-معدات حذف-الكل`\n' +
            '`-إدارة-معدات قائمة`\n' +
            '`-إدارة-معدات عرض`'
        );
    },

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ You do not have permission.', flags: 64 });

        const sub = interaction.options.getSubcommand();
        const row = new ActionRowBuilder().addComponents(resetButton);

        if (sub === 'اضافة') {
            const name  = interaction.options.getString('الاسم').trim();
            const price = interaction.options.getInteger('السعر');
            const desc  = interaction.options.getString('الوصف')?.trim() || null;
            const item  = await db.addEquipmentItem(name, price, desc);
            const _img = await db.getImage('معدات').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Equipment Added')
                .setColor(0x4527A0)
                .addFields(
                    { name: 'ID',          value: String(item.id),                               inline: true },
                    { name: 'Name',        value: item.name,                                     inline: true },
                    { name: 'Price',       value: `${Number(item.price).toLocaleString()} Riyals`, inline: true },
                    { name: 'Description', value: item.description || '—',                       inline: false },
                )
                .setFooter({ text: 'Equipment Admin • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'حذف') {
            const id   = interaction.options.getInteger('id');
            const item = await db.getEquipmentItemById(id);
            if (!item) return interaction.reply({ content: `❌ No equipment found with ID: ${id}`, flags: 64 });
            await db.deleteEquipmentItem(id);
            return interaction.reply({ content: `✅ **${item.name}** deleted successfully.`, flags: 64 });
        }

        if (sub === 'حذف-الكل') {
            await db.deleteAllEquipmentItems();
            return interaction.reply({ content: '✅ All equipment deleted.', flags: 64 });
        }

        if (sub === 'تعديل') {
            const id    = interaction.options.getInteger('id');
            const name  = interaction.options.getString('الاسم')?.trim();
            const price = interaction.options.getInteger('السعر') || undefined;
            const desc  = interaction.options.getString('الوصف')?.trim();
            if (!name && !price && desc === undefined)
                return interaction.reply({ content: '❌ At least one field must be specified for editing.', flags: 64 });
            const item = await db.updateEquipmentItem(id, {
                ...(name  ? { name }  : {}),
                ...(price ? { price } : {}),
                ...(desc !== undefined ? { description: desc || null } : {}),
            });
            if (!item) return interaction.reply({ content: `❌ No equipment found with ID: ${id}`, flags: 64 });
            const _img = await db.getImage('معدات').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Equipment Updated')
                .setColor(0x4527A0)
                .addFields(
                    { name: 'ID',          value: String(item.id),                               inline: true },
                    { name: 'Name',        value: item.name,                                     inline: true },
                    { name: 'Price',       value: `${Number(item.price).toLocaleString()} Riyals`, inline: true },
                    { name: 'Description', value: item.description || '—',                       inline: false },
                )
                .setFooter({ text: 'Equipment Admin • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'قائمة') {
            const items = await db.getEquipmentItems();
            const _img = await db.getImage('معدات').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Equipment List')
                .setColor(0x4527A0)
                .setFooter({ text: 'Equipment Admin • FANTASY Bot' }).setTimestamp();
            if (!items.length) {
                embed.setDescription('No equipment added yet.');
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
            const eq = require('./equipment');
            const payload = await eq.buildEquipment(db);
            await interaction.reply({ content: '✅ Equipment store embed sent.', flags: 64 });
            return interaction.channel.send(payload);
        }
    },
};
