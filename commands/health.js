const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'health',
    data: new SlashCommandBuilder()
        .setName('health')
        .setDescription('نظام وزارة الصحة'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('🏥 وزارة الصحة')
            .setColor(0x1B5E20)
            .setDescription('اختر الخدمة الطبية التي تحتاجها')
            .addFields(
                { name: '🩺 الخدمات المتاحة', value: 'إنعاش مستشفى • تحلل • إنعاش ساحرة', inline: false },
            )
            .setImage(await db.getImage('health') || null)
            .setFooter({ text: 'نظام الصحة • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('health_menu')
                .setPlaceholder('اختر الخدمة الطبية')
                .addOptions([
                    { label: '🏥 إنعاش مستشفى', value: 'hospital_resuscitation' },
                    { label: '💀 تحلل', value: 'decay' },
                    { label: '🧙 إنعاش ساحرة', value: 'witch_resuscitation' },
                ])
        );
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('🏥 وزارة الصحة')
            .setColor(0x1B5E20)
            .setDescription('اختر الخدمة الطبية التي تحتاجها')
            .addFields(
                { name: '🩺 الخدمات المتاحة', value: 'إنعاش مستشفى • تحلل • إنعاش ساحرة', inline: false },
            )
            .setImage(await db.getImage('health') || null)
            .setFooter({ text: 'نظام الصحة • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('health_menu')
                .setPlaceholder('اختر الخدمة الطبية')
                .addOptions([
                    { label: '🏥 إنعاش مستشفى', value: 'hospital_resuscitation' },
                    { label: '💀 تحلل', value: 'decay' },
                    { label: '🧙 إنعاش ساحرة', value: 'witch_resuscitation' },
                ])
        );
        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
