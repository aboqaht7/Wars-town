const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'تعيين-رتبة-مبند',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-مبند')
        .setDescription('🔧 تحديد Rank المبند التي تُعطى عند إصدار مخالفة')
        .addRoleOption(o =>
            o.setName('الرتبة').setDescription('الRank التي تمثل المبند').setRequired(true)
        ),

    async slashExecute(interaction, db) {
        const { isAdmin } = require('../utils');
        if (!(await isAdmin(interaction.member, db)))
            return interaction.reply({ content: '❌ Admins only.', flags: 64 });

        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('violation_role_id', role.id);

        const _img = await db.getImage('admin').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Ban Role Set')
            .setColor(0xB71C1C)
            .setDescription('This role will be automatically assigned when `-مخالف` is issued, and removed when the duration expires or `-فك-مخالف` is executed.')
            .addFields(
                { name: '🚫 Role',    value: `<@&${role.id}>`, inline: true },
                { name: '🆔 Role ID', value: role.id,          inline: true },
            )
            .setFooter({ text: 'Violations System • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);
        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '​', flags: 64 });
    },
};
