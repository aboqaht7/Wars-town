const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('reset_menu').setLabel('Reset Menu').setEmoji({ id: '1479212270746599528', name: 'GL137', animated: true }).setStyle(ButtonStyle.Secondary)
);

module.exports = {
    name: 'تعيين-رتبة-قاضي',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-قاضي')
        .setDescription('🔧 تحديد Rank الديسكورد الخاصة بالقضاة')
        .addRoleOption(o => o.setName('الرتبة').setDescription('الRank التي تمثل القضاة').setRequired(true)),

    async slashExecute(interaction, db) {
        const { isAdmin } = require('../utils');
        if (!(await isAdmin(interaction.member, db)))
            return interaction.reply({ content: '❌ للإدارة فقط.', flags: 64 });

        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('judge_role_id', role.id);

        const _img = await db.getImage('عدل').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Judges Role Set')
            .setColor(0x4A148C)
            .setDescription('أعضاء هذه الRank سيظهرون عند توكيل قاضٍ لقضية.')
            .addFields(
                { name: '⚖️ الRank',        value: `<@&${role.id}>`, inline: true },
                { name: '🆔 معرّف الRank',  value: role.id,          inline: true },
            )
            .setFooter({ text: 'Justice System • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);
        await interaction.channel.send({ embeds: [embed], components: [row2] });
        return interaction.reply({ content: '​', flags: 64 });
    },
};
