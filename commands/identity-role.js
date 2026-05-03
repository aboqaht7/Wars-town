const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'هوية-رتبة',
    data: new SlashCommandBuilder()
        .setName('هوية-رتبة')
        .setDescription('تعيين Rank granted automatically upon identity approval')
        .addRoleOption(opt =>
            opt.setName('الرتبة').setDescription('Rank given upon identity approval').setRequired(true)),

    async slashExecute(interaction, db) {
        const role = interaction.options.getRole('الرتبة');
        await db.setConfig('identity_role', role.id);

        const _img = await db.getImage('identity').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Identity Role Set')
            .setColor(0xE53935)
            .setDescription(`Everyone whose identity is accepted will receive rank ${role} automatically.`)
            .setFooter({ text: 'Identity System • FANTASY Bot' })
            .setTimestamp();
        if (_img) embed.setImage(_img);
        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '​', flags: 64 });
    }
};
