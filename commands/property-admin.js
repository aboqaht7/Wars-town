const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'إدارة-عقارات',
    data: new SlashCommandBuilder()
        .setName('إدارة-عقارات')
        .setDescription('إدارة العقارات (أدمن فقط)')
        .addSubcommand(sub => sub
            .setName('اضافة')
            .setDescription('إضافة عقار جديد')
            .addStringOption(o => o.setName('اسم').setDescription('اسم العقار').setRequired(true))
            .addIntegerOption(o => o.setName('سعر').setDescription('سعر العقار (ريال)').setRequired(true).setMinValue(1))
            .addStringOption(o => o.setName('صورة').setDescription('رابط صورة العقار (URL)').setRequired(false))
        )
        .addSubcommand(sub => sub
            .setName('تعديل-صورة')
            .setDescription('تعديل صورة عقار موجود')
            .addIntegerOption(o => o.setName('رقم').setDescription('رقم العقار').setRequired(true))
            .addStringOption(o => o.setName('صورة').setDescription('الرابط الجديد للصورة').setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName('حذف')
            .setDescription('حذف عقار برقمه')
            .addIntegerOption(o => o.setName('رقم').setDescription('رقم العقار').setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName('حذف-الكل')
            .setDescription('حذف جميع العقارات')
        )
        .addSubcommand(sub => sub
            .setName('قائمة')
            .setDescription('عرض جميع العقارات المضافة')
        ),

    async slashExecute(interaction, db) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'اضافة') {
            const name     = interaction.options.getString('اسم').trim();
            const price    = interaction.options.getInteger('سعر');
            const imageUrl = interaction.options.getString('صورة') || null;

            const row = await db.addProperty(name, price, imageUrl);
            const embed = new EmbedBuilder()
                .setTitle('✅ تمت إضافة العقار')
                .setColor(0xB71C1C)
                .addFields(
                    { name: '🔖 الرقم',    value: `\`${row.id}\``, inline: true },
                    { name: '🏠 الاسم',    value: name, inline: true },
                    { name: '💰 السعر',    value: `\`${price.toLocaleString()} ريال\``, inline: true },
                    { name: '🖼️ الصورة',  value: imageUrl ? `[رابط](${imageUrl})` : '`لم يتم تحديدها`', inline: false },
                )
                .setFooter({ text: 'نظام العقارات • بوت FANTASY' })
                .setTimestamp();
            if (imageUrl) embed.setThumbnail(imageUrl);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'تعديل-صورة') {
            const id       = interaction.options.getInteger('رقم');
            const imageUrl = interaction.options.getString('صورة').trim();
            const prop = await db.getPropertyById(id);
            if (!prop) return interaction.reply({ content: `❌ لا يوجد عقار برقم \`${id}\`.`, flags: 64 });
            await db.updatePropertyImage(id, imageUrl);
            const embed = new EmbedBuilder()
                .setTitle('✅ تم تحديث صورة العقار')
                .setColor(0xB71C1C)
                .addFields(
                    { name: '🏠 العقار', value: prop.name, inline: true },
                    { name: '🖼️ الصورة الجديدة', value: `[رابط](${imageUrl})`, inline: false },
                )
                .setImage(imageUrl)
                .setFooter({ text: 'نظام العقارات • بوت FANTASY' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'حذف') {
            const id = interaction.options.getInteger('رقم');
            const prop = await db.getPropertyById(id);
            if (!prop) return interaction.reply({ content: `❌ لا يوجد عقار برقم \`${id}\`.`, flags: 64 });
            await db.deleteProperty(id);
            const embed = new EmbedBuilder()
                .setTitle('🗑️ تم حذف العقار')
                .setColor(0x757575)
                .setDescription(`تم حذف عقار **${prop.name}** بنجاح.`)
                .setFooter({ text: 'نظام العقارات • بوت FANTASY' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'حذف-الكل') {
            await db.deleteAllProperties();
            const embed = new EmbedBuilder()
                .setTitle('🗑️ تم حذف جميع العقارات')
                .setColor(0x757575)
                .setDescription('> تم مسح جميع العقارات من القائمة.')
                .setFooter({ text: 'نظام العقارات • بوت FANTASY' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'قائمة') {
            const props = await db.getProperties();
            const embed = new EmbedBuilder()
                .setTitle('📋 قائمة العقارات')
                .setColor(0xB71C1C)
                .setFooter({ text: `${props.length} عقار • بوت FANTASY` })
                .setTimestamp();
            if (!props.length) {
                embed.setDescription('> لا توجد عقارات مضافة بعد.');
            } else {
                embed.setDescription(props.map(p =>
                    `**\`#${p.id}\` ${p.name}**\n💰 \`${Number(p.price).toLocaleString()} ريال\`\n🖼️ ${p.image_url ? `[صورة](${p.image_url})` : '`لا توجد صورة`'}`
                ).join('\n\n'));
            }
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }
    }
};
