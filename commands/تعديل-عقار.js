const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'تعديل-عقار',
    data: new SlashCommandBuilder()
        .setName('تعديل-عقار')
        .setDescription('تعديل عقار موجود (أدمن فقط)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addIntegerOption(o => o.setName('رقم').setDescription('رقم العقار').setRequired(true))
        .addStringOption(o => o.setName('اسم').setDescription('الاسم الجديد للعقار').setRequired(false))
        .addIntegerOption(o => o.setName('سعر').setDescription('السعر الجديد (ريال)').setRequired(false).setMinValue(1))
        .addStringOption(o => o.setName('صورة').setDescription('رابط الصورة الجديد (URL)').setRequired(false)),

    async slashExecute(interaction, db) {
        const id       = interaction.options.getInteger('رقم');
        const name     = interaction.options.getString('اسم')    ?? undefined;
        const price    = interaction.options.getInteger('سعر')   ?? undefined;
        const imageUrl = interaction.options.getString('صورة')   ?? undefined;

        if ([name, price, imageUrl].every(v => v === undefined)) {
            return interaction.reply({ content: '❌ يجب تعديل حقل واحد على الأقل.', flags: 64 });
        }

        const existing = await db.getPropertyById(id);
        if (!existing) return interaction.reply({ content: `❌ لا يوجد عقار برقم \`${id}\`.`, flags: 64 });

        const updated = await db.updateProperty(id, { name, price, imageUrl });

        const embed = new EmbedBuilder()
            .setTitle('✅ تم تعديل العقار')
            .setColor(0xB71C1C)
            .addFields(
                { name: '🔖 الرقم',   value: `\`${updated.id}\``, inline: true },
                { name: '🏠 الاسم',   value: updated.name, inline: true },
                { name: '💰 السعر',   value: `\`${Number(updated.price).toLocaleString()} ريال\``, inline: true },
                { name: '🖼️ الصورة', value: updated.image_url ? `[رابط](${updated.image_url})` : '`لا توجد صورة`', inline: false },
            )
            .setFooter({ text: 'نظام العقارات • بوت FANTASY' })
            .setTimestamp();
        if (updated.image_url) embed.setThumbnail(updated.image_url);
        return interaction.reply({ embeds: [embed] });
    }
};
