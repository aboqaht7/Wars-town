const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'identity',
    data: new SlashCommandBuilder()
        .setName('identity')
        .setDescription('عرض الهوية'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('🪪 نظام الهوية')
            .setColor(0x4A148C)
            .setDescription(`مرحباً **${message.author.username}**\nاختر شخصيتك الحالية`)
            .addFields(
                { name: '👤 الشخصيات', value: 'يمكنك امتلاك حتى **4 شخصيات**', inline: true },
                { name: '🔒 ملاحظة', value: 'الشخصيات 3 و4 تتطلب فتحاً من الإدارة', inline: true },
            )
            .setImage(await db.getImage('identity') || null)
            .setFooter({ text: 'نظام الهوية • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('identity_menu')
                .setPlaceholder('اختر شخصيتك')
                .addOptions([
                    { label: '👤 شخصية 1', value: 'char1' },
                    { label: '👤 شخصية 2', value: 'char2' },
                    { label: '🔒 شخصية 3 (مقفلة)', value: 'char3' },
                    { label: '🔒 شخصية 4 (مقفلة)', value: 'char4' },
                ])
        );
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('🪪 نظام الهوية')
            .setColor(0x4A148C)
            .setDescription(`مرحباً **${interaction.user.username}**\nاختر شخصيتك الحالية`)
            .addFields(
                { name: '👤 الشخصيات', value: 'يمكنك امتلاك حتى **4 شخصيات**', inline: true },
                { name: '🔒 ملاحظة', value: 'الشخصيات 3 و4 تتطلب فتحاً من الإدارة', inline: true },
            )
            .setImage(await db.getImage('identity') || null)
            .setFooter({ text: 'نظام الهوية • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('identity_menu')
                .setPlaceholder('اختر شخصيتك')
                .addOptions([
                    { label: '👤 شخصية 1', value: 'char1' },
                    { label: '👤 شخصية 2', value: 'char2' },
                    { label: '🔒 شخصية 3 (مقفلة)', value: 'char3' },
                    { label: '🔒 شخصية 4 (مقفلة)', value: 'char4' },
                ])
        );
        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
