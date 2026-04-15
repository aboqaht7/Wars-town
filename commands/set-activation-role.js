const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'تعيين-رتبة-تفعيل',
    data: new SlashCommandBuilder()
        .setName('تعيين-رتبة-تفعيل')
        .setDescription('🔧 تحديد الRank التي تُعطى عند قبول طلب التفعيل')
        .addRoleOption(o =>
            o.setName('الرتبة').setDescription('Rank المفعّلين').setRequired(true)
        ),

    async slashExecute(interaction, db) {
        const { isAdmin } = require('../utils');
        if (!(await isAdmin(interaction.member, db)))
            return interaction.reply({ content: '❌ للإدارة فقط.', flags: 64 });

        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('activation_role_id', role.id);

        const _img = await db.getImage('identity').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Activation Role Set')
            .setColor(0x2E7D32)
            .addFields(
                { name: '🎖️ الRank',       value: `<@&${role.id}>`, inline: true },
                { name: '🆔 معرّف الRank', value: role.id,          inline: true },
            )
            .setFooter({ text: 'Activation System • FANTASY Bot' }).setTimestamp();

        if (_img) embed.setImage(_img);
        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '​', flags: 64 });
    },
};
