const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { logEvent } = require('../loggers');

module.exports = {
    name: 'إدارة-عقارات',
    data: new SlashCommandBuilder()
        .setName('إدارة-عقارات')
        .setDescription('Manage properties (admin only)')
        .addSubcommand(sub => sub
            .setName('اضافة')
            .setDescription('Add a new property')
            .addStringOption(o => o.setName('اسم').setDescription('Property name').setRequired(true))
            .addIntegerOption(o => o.setName('سعر').setDescription('Property price (Riyals)').setRequired(true).setMinValue(1))
            .addStringOption(o => o.setName('صورة').setDescription('Property image URL').setRequired(false))
        )
        .addSubcommand(sub => sub
            .setName('تعديل-صورة')
            .setDescription('Update property image')
            .addIntegerOption(o => o.setName('رقم').setDescription('Property ID').setRequired(true))
            .addStringOption(o => o.setName('صورة').setDescription('New image URL').setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName('حذف')
            .setDescription('Delete a property by ID')
            .addIntegerOption(o => o.setName('رقم').setDescription('Property ID').setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName('حذف-الكل')
            .setDescription('Delete all properties')
        )
        .addSubcommand(sub => sub
            .setName('قائمة')
            .setDescription('View all added properties')
        ),

    async slashExecute(interaction, db) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'اضافة') {
            const name     = interaction.options.getString('اسم').trim();
            const price    = interaction.options.getInteger('سعر');
            const imageUrl = interaction.options.getString('صورة') || null;

            const row = await db.addProperty(name, price, imageUrl);
            const embed = new EmbedBuilder()
                .setTitle('Property Added')
                .setColor(0xE53935)
                .addFields(
                    { name: '🔖 ID',     value: `\`${row.id}\``, inline: true },
                    { name: '🏠 Name',   value: name, inline: true },
                    { name: '💰 Price',  value: `\`${price.toLocaleString()} Riyals\``, inline: true },
                    { name: '🖼️ Image', value: imageUrl ? `[Link](${imageUrl})` : '`Not set`', inline: false },
                )
                .setFooter({ text: 'Properties System • FANTASY Bot' })
                .setTimestamp();
            if (imageUrl) embed.setThumbnail(imageUrl);
            await interaction.channel.send({ embeds: [embed] });
            logEvent(interaction.client, db, 'property', embed).catch(() => {});
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'تعديل-صورة') {
            const id       = interaction.options.getInteger('رقم');
            const imageUrl = interaction.options.getString('صورة').trim();
            const prop = await db.getPropertyById(id);
            if (!prop) return interaction.reply({ content: `❌ No property found with ID \`${id}\`.`, flags: 64 });
            await db.updatePropertyImage(id, imageUrl);
            const embed = new EmbedBuilder()
                .setTitle('Property Image Updated')
                .setColor(0xE53935)
                .addFields(
                    { name: '🏠 Property',   value: prop.name, inline: true },
                    { name: '🖼️ New Image', value: `[Link](${imageUrl})`, inline: false },
                )
                .setImage(imageUrl)
                .setFooter({ text: 'Properties System • FANTASY Bot' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed] });
            logEvent(interaction.client, db, 'property', embed).catch(() => {});
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'حذف') {
            const id = interaction.options.getInteger('رقم');
            const prop = await db.getPropertyById(id);
            if (!prop) return interaction.reply({ content: `❌ No property found with ID \`${id}\`.`, flags: 64 });
            await db.deleteProperty(id);
            const embed = new EmbedBuilder()
                .setTitle('Property Deleted')
                .setColor(0xE53935)
                .setDescription(`Property **${prop.name}** has been deleted successfully.`)
                .setFooter({ text: 'Properties System • FANTASY Bot' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed] });
            logEvent(interaction.client, db, 'property', embed).catch(() => {});
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'حذف-الكل') {
            await db.deleteAllProperties();
            const embed = new EmbedBuilder()
                .setTitle('All Properties Deleted')
                .setColor(0xE53935)
                .setDescription('> All properties have been removed from the list.')
                .setFooter({ text: 'Properties System • FANTASY Bot' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed] });
            logEvent(interaction.client, db, 'property', embed).catch(() => {});
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'قائمة') {
            const props = await db.getProperties();
            const embed = new EmbedBuilder()
                .setTitle('Properties List')
                .setColor(0xE53935)
                .setFooter({ text: `${props.length} property(s) • FANTASY Bot` })
                .setTimestamp();
            if (!props.length) {
                embed.setDescription('> No properties added yet.');
            } else {
                embed.setDescription(props.map(p =>
                    `**\`#${p.id}\` ${p.name}**\n💰 \`${Number(p.price).toLocaleString()} Riyals\`\n🖼️ ${p.image_url ? `[Image](${p.image_url})` : '`No image`'}`
                ).join('\n\n'));
            }
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }
    }
};
