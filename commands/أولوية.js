const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle: BS } = require('discord.js');

const STYLE_MAP = { Primary: BS.Primary, Secondary: BS.Secondary, Success: BS.Success, Danger: BS.Danger };

function buildEmbed() {
    return new EmbedBuilder()
        .setTitle('🚨 نظام الأولوية')
        .setDescription('اختر مستوى الأولوية بالضغط على الزر المناسب.')
        .setColor(0xF57C00)
        .setFooter({ text: 'نظام الأولوية • بوت FANTASY' })
        .setTimestamp();
}

module.exports = {
    name: 'أولوية',
    data: new SlashCommandBuilder()
        .setName('أولوية')
        .setDescription('عرض لوحة الأولوية'),

    async slashExecute(interaction, db) {
        const buttons = await db.getPriorityButtons();
        if (!buttons.length)
            return interaction.reply({ content: '❌ لم تتم إضافة أي أزرار أولوية بعد.', flags: 64 });

        const rows = [];
        let currentRow = new ActionRowBuilder();
        for (let i = 0; i < buttons.length; i++) {
            const b = buttons[i];
            currentRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`priority_${b.id}`)
                    .setLabel(b.label)
                    .setStyle(STYLE_MAP[b.style] || BS.Primary)
            );
            if (currentRow.components.length === 5 || i === buttons.length - 1) {
                rows.push(currentRow);
                currentRow = new ActionRowBuilder();
            }
        }

        if (interaction._isReset) {
            return interaction.message.edit({ embeds: [buildEmbed()], components: rows });
        }

        await interaction.reply({ content: '\u200b', flags: 64 });
        await interaction.channel.send({ embeds: [buildEmbed()], components: rows });
    },

    buildEmbed,
};
