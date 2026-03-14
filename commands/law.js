const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'law',
    data: new SlashCommandBuilder()
        .setName('law')
        .setDescription('نظام المحاماة والقضايا'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('⚖️ نظام المحاماة')
            .setColor(0x0D47A1)
            .setDescription('مكتب المحاماة — اختر خدمتك القانونية')
            .addFields(
                { name: '📁 القضايا', value: 'يمكن فتح قضية جديدة أو متابعة قضية قائمة', inline: false },
                { name: '👨‍⚖️ التواصل', value: 'تواصل مع الإدارة لتوكيل محامٍ', inline: false },
            )
            .setImage(await db.getImage('law') || null)
            .setFooter({ text: 'نظام المحاماة • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('law_menu')
                .setPlaceholder('اختر خدمة قانونية')
                .addOptions([
                    { label: '📁 فتح قضية', value: 'new_case' },
                    { label: '📋 عرض القضايا', value: 'view_cases' },
                    { label: '👨‍⚖️ توكيل محامٍ', value: 'hire_lawyer' },
                    { label: '⚖️ الإجراءات القانونية', value: 'legal_process' },
                ])
        );
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('⚖️ نظام المحاماة')
            .setColor(0x0D47A1)
            .setDescription('مكتب المحاماة — اختر خدمتك القانونية')
            .addFields(
                { name: '📁 القضايا', value: 'يمكن فتح قضية جديدة أو متابعة قضية قائمة', inline: false },
                { name: '👨‍⚖️ التواصل', value: 'تواصل مع الإدارة لتوكيل محامٍ', inline: false },
            )
            .setImage(await db.getImage('law') || null)
            .setFooter({ text: 'نظام المحاماة • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('law_menu')
                .setPlaceholder('اختر خدمة قانونية')
                .addOptions([
                    { label: '📁 فتح قضية', value: 'new_case' },
                    { label: '📋 عرض القضايا', value: 'view_cases' },
                    { label: '👨‍⚖️ توكيل محامٍ', value: 'hire_lawyer' },
                    { label: '⚖️ الإجراءات القانونية', value: 'legal_process' },
                ])
        );
        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
