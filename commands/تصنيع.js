const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const RESOURCES = ['ألمنيوم', 'حديد', 'خشب', 'أربطة', 'مسامير'];

const WEAPONS = [
    { value: 'craft_sns',     label: '🔫 Pistol SNS',     description: 'يحتاج 200 من كل مورد', req: 200 },
    { value: 'craft_vintage', label: '🔫 Pistol Vintage',  description: 'يحتاج 300 من كل مورد', req: 300 },
    { value: 'craft_mkii',    label: '🔫 Pistol MK II',    description: 'يحتاج 500 من كل مورد', req: 500 },
];

function buildEmbed() {
    return new EmbedBuilder()
        .setTitle('🏭 نظام التصنيع')
        .setDescription('اختر المسدس الذي تريد تصنيعه من القائمة أدناه.')
        .setColor(0xe74c3c);
}

function buildRow() {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('craft_weapon')
            .setPlaceholder('🔫 اختر المسدس...')
            .addOptions(WEAPONS.map(w => ({
                label: w.label,
                description: w.description,
                value: w.value,
            })))
    );
}

module.exports = {
    name: 'تصنيع',
    data: new SlashCommandBuilder()
        .setName('تصنيع')
        .setDescription('صنّع مسدسات من الموارد التي جمعتها'),

    async slashExecute(interaction, db) {
        const identity = await db.getActiveIdentity(interaction.user.id);
        if (!identity) return interaction.reply({ content: 'ماسجلت دخولك؟سجل دخولك يالامير بعدين تعال', flags: 64 });

        if (interaction._isReset) {
            return interaction.message.edit({ embeds: [buildEmbed()], components: [buildRow()] });
        }
        await interaction.reply({ content: '\u200b', flags: 65 });
        await interaction.channel.send({ embeds: [buildEmbed()], components: [buildRow()] });
    },

    RESOURCES,
    WEAPONS,
    buildEmbed,
    buildRow,
};
