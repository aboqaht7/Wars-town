const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);

module.exports = {
    name: 'إدارة-معدات',
    data: new SlashCommandBuilder()
        .setName('إدارة-معدات')
        .setDescription('إدارة أغراض متجر المعدات')
        .addSubcommand(s => s
            .setName('اضافة')
            .setDescription('أضف معدة للمتجر')
            .addStringOption(o => o.setName('الاسم').setDescription('اسم المعدة').setRequired(true))
            .addIntegerOption(o => o.setName('السعر').setDescription('السعر بالريال').setRequired(true).setMinValue(1))
            .addStringOption(o => o.setName('الوصف').setDescription('وصف المعدة (اختياري)').setRequired(false))
        )
        .addSubcommand(s => s
            .setName('حذف')
            .setDescription('احذف معدة بالـ ID')
            .addIntegerOption(o => o.setName('id').setDescription('ID المعدة').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('حذف-الكل')
            .setDescription('احذف جميع المعدات')
        )
        .addSubcommand(s => s
            .setName('تعديل')
            .setDescription('عدّل معدة بالـ ID')
            .addIntegerOption(o => o.setName('id').setDescription('ID المعدة').setRequired(true))
            .addStringOption(o => o.setName('الاسم').setDescription('الاسم الجديد').setRequired(false))
            .addIntegerOption(o => o.setName('السعر').setDescription('السعر الجديد').setRequired(false).setMinValue(1))
            .addStringOption(o => o.setName('الوصف').setDescription('الوصف الجديد').setRequired(false))
        )
        .addSubcommand(s => s
            .setName('قائمة')
            .setDescription('عرض جميع المعدات')
        )
        .addSubcommand(s => s
            .setName('عرض')
            .setDescription('أرسل إمبيد متجر المعدات في الروم الحالي')
        ),

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
            return message.reply('❌ ليس لديك صلاحية.');

        const sub = args[0];
        const row = new ActionRowBuilder().addComponents(resetButton);

        if (sub === 'اضافة') {
            const rest = args.slice(1).join(' ');
            const parts = rest.split('|').map(p => p.trim());
            const name  = parts[0];
            const price = parseInt(parts[1]);
            const desc  = parts[2] || null;
            if (!name || isNaN(price) || price < 1)
                return message.reply('❌ الاستخدام الصحيح:\n`-إدارة-معدات اضافة اسم المعدة | السعر | الوصف (اختياري)`');
            const item = await db.addEquipmentItem(name, price, desc);
            const embed = new EmbedBuilder()
                .setTitle('✅ تمت إضافة المعدة')
                .setColor(0x4527A0)
                .addFields(
                    { name: 'ID',    value: String(item.id),                               inline: true },
                    { name: 'الاسم', value: item.name,                                     inline: true },
                    { name: 'السعر', value: `${Number(item.price).toLocaleString()} ريال`, inline: true },
                    { name: 'الوصف', value: item.description || '—',                       inline: false },
                )
                .setFooter({ text: 'إدارة المعدات • بوت FANTASY' }).setTimestamp();
            return message.channel.send({ embeds: [embed], components: [row] });
        }

        if (sub === 'حذف') {
            const id   = parseInt(args[1]);
            if (isNaN(id)) return message.reply('❌ الاستخدام: `-إدارة-معدات حذف [ID]`');
            const item = await db.getEquipmentItemById(id);
            if (!item) return message.reply(`❌ لا توجد معدة بـ ID: ${id}`);
            await db.deleteEquipmentItem(id);
            return message.reply(`✅ تم حذف **${item.name}** بنجاح.`);
        }

        if (sub === 'حذف-الكل') {
            await db.deleteAllEquipmentItems();
            return message.reply('✅ تم حذف جميع المعدات.');
        }

        if (sub === 'قائمة') {
            const items = await db.getEquipmentItems();
            const embed = new EmbedBuilder()
                .setTitle('🔨 قائمة المعدات')
                .setColor(0x4527A0)
                .setFooter({ text: 'إدارة المعدات • بوت FANTASY' }).setTimestamp();
            if (!items.length) {
                embed.setDescription('لا توجد معدات مضافة.');
            } else {
                embed.setDescription(
                    items.map(it =>
                        `**ID ${it.id}** • ${it.name} — **${Number(it.price).toLocaleString()} ريال**` +
                        (it.description ? `\n> ${it.description}` : '')
                    ).join('\n')
                );
            }
            return message.channel.send({ embeds: [embed], components: [row] });
        }

        if (sub === 'عرض') {
            const eq = require('./equipment');
            const payload = await eq.buildEquipment(db);
            return message.channel.send(payload);
        }

        return message.reply(
            '**أوامر إدارة المعدات:**\n' +
            '`-إدارة-معدات اضافة الاسم | السعر | الوصف`\n' +
            '`-إدارة-معدات حذف [ID]`\n' +
            '`-إدارة-معدات حذف-الكل`\n' +
            '`-إدارة-معدات قائمة`\n' +
            '`-إدارة-معدات عرض`'
        );
    },

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ ليس لديك صلاحية.', flags: 64 });

        const sub = interaction.options.getSubcommand();
        const row = new ActionRowBuilder().addComponents(resetButton);

        if (sub === 'اضافة') {
            const name  = interaction.options.getString('الاسم').trim();
            const price = interaction.options.getInteger('السعر');
            const desc  = interaction.options.getString('الوصف')?.trim() || null;
            const item  = await db.addEquipmentItem(name, price, desc);
            const embed = new EmbedBuilder()
                .setTitle('✅ تمت إضافة المعدة')
                .setColor(0x4527A0)
                .addFields(
                    { name: 'ID',    value: String(item.id),                               inline: true },
                    { name: 'الاسم', value: item.name,                                     inline: true },
                    { name: 'السعر', value: `${Number(item.price).toLocaleString()} ريال`, inline: true },
                    { name: 'الوصف', value: item.description || '—',                       inline: false },
                )
                .setFooter({ text: 'إدارة المعدات • بوت FANTASY' }).setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'حذف') {
            const id   = interaction.options.getInteger('id');
            const item = await db.getEquipmentItemById(id);
            if (!item) return interaction.reply({ content: `❌ لا توجد معدة بـ ID: ${id}`, flags: 64 });
            await db.deleteEquipmentItem(id);
            return interaction.reply({ content: `✅ تم حذف **${item.name}** بنجاح.`, flags: 64 });
        }

        if (sub === 'حذف-الكل') {
            await db.deleteAllEquipmentItems();
            return interaction.reply({ content: '✅ تم حذف جميع المعدات.', flags: 64 });
        }

        if (sub === 'تعديل') {
            const id    = interaction.options.getInteger('id');
            const name  = interaction.options.getString('الاسم')?.trim();
            const price = interaction.options.getInteger('السعر') || undefined;
            const desc  = interaction.options.getString('الوصف')?.trim();
            if (!name && !price && desc === undefined)
                return interaction.reply({ content: '❌ يجب تحديد حقل واحد على الأقل للتعديل.', flags: 64 });
            const item = await db.updateEquipmentItem(id, {
                ...(name  ? { name }  : {}),
                ...(price ? { price } : {}),
                ...(desc !== undefined ? { description: desc || null } : {}),
            });
            if (!item) return interaction.reply({ content: `❌ لا توجد معدة بـ ID: ${id}`, flags: 64 });
            const embed = new EmbedBuilder()
                .setTitle('✅ تم التعديل')
                .setColor(0x4527A0)
                .addFields(
                    { name: 'ID',    value: String(item.id),                               inline: true },
                    { name: 'الاسم', value: item.name,                                     inline: true },
                    { name: 'السعر', value: `${Number(item.price).toLocaleString()} ريال`, inline: true },
                    { name: 'الوصف', value: item.description || '—',                       inline: false },
                )
                .setFooter({ text: 'إدارة المعدات • بوت FANTASY' }).setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'قائمة') {
            const items = await db.getEquipmentItems();
            const embed = new EmbedBuilder()
                .setTitle('🔨 قائمة المعدات')
                .setColor(0x4527A0)
                .setFooter({ text: 'إدارة المعدات • بوت FANTASY' }).setTimestamp();
            if (!items.length) {
                embed.setDescription('لا توجد معدات مضافة.');
            } else {
                embed.setDescription(
                    items.map(it =>
                        `**ID ${it.id}** • ${it.name} — **${Number(it.price).toLocaleString()} ريال**` +
                        (it.description ? `\n> ${it.description}` : '')
                    ).join('\n')
                );
            }
            await interaction.channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'عرض') {
            const eq = require('./equipment');
            const payload = await eq.buildEquipment(db);
            await interaction.reply({ content: '✅ تم إرسال إمبيد متجر المعدات.', flags: 64 });
            return interaction.channel.send(payload);
        }
    },
};
