const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);

module.exports = {
    name: 'إدارة-بلاك-ماركت',
    data: new SlashCommandBuilder()
        .setName('إدارة-بلاك-ماركت')
        .setDescription('إدارة أغراض البلاك ماركت')
        .addSubcommand(s => s
            .setName('اضافة')
            .setDescription('أضف غرضاً جديداً')
            .addStringOption(o => o.setName('الاسم').setDescription('اسم الغرض').setRequired(true))
            .addIntegerOption(o => o.setName('السعر').setDescription('السعر بالدولار').setRequired(true).setMinValue(1))
        )
        .addSubcommand(s => s
            .setName('حذف')
            .setDescription('احذف غرضاً بالـ ID')
            .addIntegerOption(o => o.setName('id').setDescription('ID الغرض').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('حذف-الكل')
            .setDescription('احذف جميع أغراض البلاك ماركت')
        )
        .addSubcommand(s => s
            .setName('تعديل')
            .setDescription('عدّل غرضاً بالـ ID')
            .addIntegerOption(o => o.setName('id').setDescription('ID الغرض').setRequired(true))
            .addStringOption(o => o.setName('الاسم').setDescription('الاسم الجديد').setRequired(false))
            .addIntegerOption(o => o.setName('السعر').setDescription('السعر الجديد').setRequired(false).setMinValue(1))
        )
        .addSubcommand(s => s
            .setName('قائمة')
            .setDescription('عرض جميع أغراض البلاك ماركت')
        )
        .addSubcommand(s => s
            .setName('عرض')
            .setDescription('أرسل إمبيد البلاك ماركت العام في الروم الحالي')
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ ليس لديك صلاحية.', flags: 64 });

        const sub = interaction.options.getSubcommand();

        if (sub === 'اضافة') {
            const name  = interaction.options.getString('الاسم').trim();
            const price = interaction.options.getInteger('السعر');
            const item  = await db.addBlackMarketItem(name, price);
            const embed = new EmbedBuilder()
                .setTitle('✅ تمت الإضافة')
                .setColor(0x1a1a2e)
                .addFields(
                    { name: 'ID',      value: String(item.id),                              inline: true },
                    { name: 'الاسم',   value: item.name,                                    inline: true },
                    { name: 'السعر',   value: `${Number(item.price).toLocaleString('en-US')}$`, inline: true },
                )
                .setFooter({ text: 'إدارة البلاك ماركت • بوت FANTASY' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetButton)] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'حذف') {
            const id   = interaction.options.getInteger('id');
            const item = await db.getBlackMarketItemById(id);
            if (!item) return interaction.reply({ content: `❌ لا يوجد غرض بـ ID: ${id}`, flags: 64 });
            await db.deleteBlackMarketItem(id);
            return interaction.reply({ content: `✅ تم حذف **${item.name}** بنجاح.`, flags: 64 });
        }

        if (sub === 'حذف-الكل') {
            await db.deleteAllBlackMarketItems();
            return interaction.reply({ content: '✅ تم حذف جميع أغراض البلاك ماركت.', flags: 64 });
        }

        if (sub === 'تعديل') {
            const id    = interaction.options.getInteger('id');
            const name  = interaction.options.getString('الاسم') || undefined;
            const price = interaction.options.getInteger('السعر') || undefined;
            if (!name && !price) return interaction.reply({ content: '❌ يجب تحديد اسم أو سعر للتعديل.', flags: 64 });
            const item = await db.updateBlackMarketItem(id, { name, price });
            if (!item) return interaction.reply({ content: `❌ لا يوجد غرض بـ ID: ${id}`, flags: 64 });
            const embed = new EmbedBuilder()
                .setTitle('✅ تم التعديل')
                .setColor(0x1a1a2e)
                .addFields(
                    { name: 'ID',      value: String(item.id),                              inline: true },
                    { name: 'الاسم',   value: item.name,                                    inline: true },
                    { name: 'السعر',   value: `${Number(item.price).toLocaleString('en-US')}$`, inline: true },
                )
                .setFooter({ text: 'إدارة البلاك ماركت • بوت FANTASY' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetButton)] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'قائمة') {
            const items = await db.getBlackMarketItems();
            const embed = new EmbedBuilder()
                .setTitle('🔫 قائمة البلاك ماركت')
                .setColor(0x1a1a2e)
                .setFooter({ text: 'إدارة البلاك ماركت • بوت FANTASY' })
                .setTimestamp();
            if (!items.length) {
                embed.setDescription('لا توجد أغراض مضافة.');
            } else {
                embed.setDescription(
                    items.map(it => `**ID ${it.id}** • ${it.name} — **${Number(it.price).toLocaleString('en-US')}$**`).join('\n')
                );
            }
            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetButton)] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'عرض') {
            const blackMarket = require('./black-market');
            const payload = await blackMarket.buildPublic();
            await interaction.reply({ content: '✅ تم إرسال إمبيد البلاك ماركت.', flags: 64 });
            return interaction.channel.send(payload);
        }
    },
};
