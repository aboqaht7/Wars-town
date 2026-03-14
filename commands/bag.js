const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'bag',
    data: new SlashCommandBuilder()
        .setName('bag')
        .setDescription('عرض الحقيبة والأغراض'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const items = await db.getInventory(message.author.id);
        const embed = new EmbedBuilder()
            .setTitle('🎒 الحقيبة')
            .setColor(0xE65100)
            .setDescription(items.length ? items.map(i => `• **${i.item_name}** — الكمية: \`${i.quantity}\``).join('\n') : '> حقيبتك فارغة حالياً')
            .addFields({ name: '📦 عدد العناصر', value: `\`${items.length}\``, inline: true })
            .setImage(await db.getImage('bag') || null)
            .setFooter({ text: 'نظام الحقيبة • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('bag_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: '👀 عرض الأغراض', value: 'view' },
                    { label: '✅ استخدام غرض', value: 'use' },
                    { label: '🗑️ إلقاء غرض', value: 'drop' },
                    { label: '📦 نقل غرض', value: 'transfer' },
                ])
        );
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const items = await db.getInventory(interaction.user.id);
        const embed = new EmbedBuilder()
            .setTitle('🎒 الحقيبة')
            .setColor(0xE65100)
            .setDescription(items.length ? items.map(i => `• **${i.item_name}** — الكمية: \`${i.quantity}\``).join('\n') : '> حقيبتك فارغة حالياً')
            .addFields({ name: '📦 عدد العناصر', value: `\`${items.length}\``, inline: true })
            .setImage(await db.getImage('bag') || null)
            .setFooter({ text: 'نظام الحقيبة • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('bag_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: '👀 عرض الأغراض', value: 'view' },
                    { label: '✅ استخدام غرض', value: 'use' },
                    { label: '🗑️ إلقاء غرض', value: 'drop' },
                    { label: '📦 نقل غرض', value: 'transfer' },
                ])
        );
        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
