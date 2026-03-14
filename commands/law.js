const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'law',
    data: new SlashCommandBuilder()
        .setName('law')
        .setDescription('نظام المحاماة والقضايا'),
    async execute(message, args, db) {
        const { embed, menu } = await build(db);
        message.channel.send({ embeds: [embed], components: [menu, resetRow('law')] });
    },
    async slashExecute(interaction, db) {
        const { embed, menu } = await build(db);
        interaction.reply({ embeds: [embed], components: [menu, resetRow('law')] });
    }
};

async function build(db) {
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
    return { embed, menu };
}
