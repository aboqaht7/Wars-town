const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);

module.exports = {
    name: 'إدارة-متجر',
    data: new SlashCommandBuilder()
        .setName('إدارة-متجر')
        .setDescription('إدارة أغراض المتجر')
        .addSubcommand(s => s
            .setName('اضافة')
            .setDescription('أضف غرضاً للمتجر')
            .addStringOption(o => o.setName('الاسم').setDescription('اسم الغرض').setRequired(true))
            .addIntegerOption(o => o.setName('السعر').setDescription('السعر بالريال').setRequired(true).setMinValue(1))
            .addStringOption(o => o.setName('الوصف').setDescription('وصف الغرض (اختياري)').setRequired(false))
        )
        .addSubcommand(s => s
            .setName('حذف')
            .setDescription('احذف غرضاً بالـ ID')
            .addIntegerOption(o => o.setName('id').setDescription('ID الغرض').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('حذف-الكل')
            .setDescription('احذف جميع أغراض المتجر')
        )
        .addSubcommand(s => s
            .setName('تعديل')
            .setDescription('عدّل غرضاً بالـ ID')
            .addIntegerOption(o => o.setName('id').setDescription('ID الغرض').setRequired(true))
            .addStringOption(o => o.setName('الاسم').setDescription('الاسم الجديد').setRequired(false))
            .addIntegerOption(o => o.setName('السعر').setDescription('السعر الجديد بالريال').setRequired(false).setMinValue(1))
            .addStringOption(o => o.setName('الوصف').setDescription('الوصف الجديد').setRequired(false))
        )
        .addSubcommand(s => s
            .setName('قائمة')
            .setDescription('عرض جميع أغراض المتجر')
        )
        .addSubcommand(s => s
            .setName('عرض')
            .setDescription('أرسل إمبيد المتجر في الروم الحالي')
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ ليس لديك صلاحية.', flags: 64 });

        const sub = interaction.options.getSubcommand();
        const row = new ActionRowBuilder().addComponents(resetButton);

        if (sub === 'اضافة') {
            const name  = interaction.options.getString('الاسم').trim();
            const price = interaction.options.getInteger('السعر');
            const desc  = interaction.options.getString('الوصف')?.trim() || null;
            const item  = await db.addMarketItem(name, price, desc);
            const embed = new EmbedBuilder()
                .setTitle('✅ تمت الإضافة للمتجر')
                .setColor(0xBF360C)
                .addFields(
                    { name: 'ID',       value: String(item.id),                                inline: true },
                    { name: 'الاسم',    value: item.name,                                      inline: true },
                    { name: 'السعر',    value: `${Number(item.price).toLocaleString()} ريال`,  inline: true },
                    { name: 'الوصف',    value: item.description || '—',                        inline: false },
                )
                .setFooter({ text: 'إدارة المتجر • بوت FANTASY' }).setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'حذف') {
            const id   = interaction.options.getInteger('id');
            const item = await db.getMarketItemById(id);
            if (!item) return interaction.reply({ content: `❌ لا يوجد غرض بـ ID: ${id}`, flags: 64 });
            await db.deleteMarketItem(id);
            return interaction.reply({ content: `✅ تم حذف **${item.name}** بنجاح.`, flags: 64 });
        }

        if (sub === 'حذف-الكل') {
            await db.deleteAllMarketItems();
            return interaction.reply({ content: '✅ تم حذف جميع أغراض المتجر.', flags: 64 });
        }

        if (sub === 'تعديل') {
            const id    = interaction.options.getInteger('id');
            const name  = interaction.options.getString('الاسم')?.trim();
            const price = interaction.options.getInteger('السعر') || undefined;
            const desc  = interaction.options.getString('الوصف')?.trim();
            if (!name && !price && desc === undefined)
                return interaction.reply({ content: '❌ يجب تحديد حقل واحد على الأقل للتعديل.', flags: 64 });
            const item = await db.updateMarketItem(id, {
                ...(name  ? { name }  : {}),
                ...(price ? { price } : {}),
                ...(desc !== undefined ? { description: desc || null } : {}),
            });
            if (!item) return interaction.reply({ content: `❌ لا يوجد غرض بـ ID: ${id}`, flags: 64 });
            const embed = new EmbedBuilder()
                .setTitle('✅ تم التعديل')
                .setColor(0xBF360C)
                .addFields(
                    { name: 'ID',    value: String(item.id),                               inline: true },
                    { name: 'الاسم', value: item.name,                                     inline: true },
                    { name: 'السعر', value: `${Number(item.price).toLocaleString()} ريال`, inline: true },
                    { name: 'الوصف', value: item.description || '—',                       inline: false },
                )
                .setFooter({ text: 'إدارة المتجر • بوت FANTASY' }).setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'قائمة') {
            const items = await db.getMarketItems();
            const embed = new EmbedBuilder()
                .setTitle('🛒 قائمة المتجر')
                .setColor(0xBF360C)
                .setFooter({ text: 'إدارة المتجر • بوت FANTASY' }).setTimestamp();
            if (!items.length) {
                embed.setDescription('لا توجد أغراض مضافة.');
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
            const market = require('./Market');
            const payload = await market.buildMarket(db);
            await interaction.reply({ content: '✅ تم إرسال إمبيد المتجر.', flags: 64 });
            return interaction.channel.send(payload);
        }
    },
};
