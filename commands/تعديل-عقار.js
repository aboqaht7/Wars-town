const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'تعديل-عقار',
    data: new SlashCommandBuilder()
        .setName('تعديل-عقار')
        .setDescription('تعديل عقار موجود (أدمن فقط)')
        .addStringOption(o => o.setName('اسم-العقار').setDescription('اسم العقار المراد تعديله').setRequired(true))
        .addStringOption(o => o.setName('اسم-جديد').setDescription('الاسم الجديد للعقار').setRequired(false))
        .addIntegerOption(o => o.setName('سعر').setDescription('السعر الجديد (ريال)').setRequired(false).setMinValue(1))
        .addStringOption(o => o.setName('صورة').setDescription('رابط الصورة الجديد (URL)').setRequired(false)),

    async slashExecute(interaction, db) {
        const searchName = interaction.options.getString('اسم-العقار').trim();
        const newName    = interaction.options.getString('اسم-جديد') ?? undefined;
        const price      = interaction.options.getInteger('سعر')      ?? undefined;
        const imageUrl   = interaction.options.getString('صورة')      ?? undefined;

        if ([newName, price, imageUrl].every(v => v === undefined)) {
            return interaction.reply({ content: '❌ At least one field must be specified for editing.', flags: 64 });
        }

        const existing = await db.getPropertyByName(searchName);
        if (!existing) return interaction.reply({ content: `❌ No property found with name **${searchName}**.`, flags: 64 });

        const updated = await db.updateProperty(existing.id, { name: newName, price, imageUrl });

        const embed = new EmbedBuilder()
            .setTitle('Property Updated')
            .setColor(0xE53935)
            .addFields(
                { name: '🔖 ID',      value: `\`${updated.id}\``, inline: true },
                { name: '🏠 Name',    value: updated.name, inline: true },
                { name: '💰 Price',   value: `\`${Number(updated.price).toLocaleString()} Riyals\``, inline: true },
                { name: '🖼️ Image',  value: updated.image_url ? `[Link](${updated.image_url})` : '`No image`', inline: false },
            )
            .setFooter({ text: 'Properties System • FANTASY Bot' })
            .setTimestamp();
        if (updated.image_url) embed.setThumbnail(updated.image_url);
        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '​', flags: 64 });
    }
};
