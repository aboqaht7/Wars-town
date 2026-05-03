const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'مسؤولين-الهوية',
    data: new SlashCommandBuilder()
        .setName('مسؤولين-الهوية')
        .setDescription('Set identity admin role and identity log channel')
        .addRoleOption(opt =>
            opt.setName('الرتبة').setDescription('Identity admin role').setRequired(true))
        .addChannelOption(opt =>
            opt.setName('قناة').setDescription('Identity log channel (where approval/rejection requests arrive)').setRequired(true)),

    async slashExecute(interaction, db) {
        const role    = interaction.options.getRole('الرتبة');
        const channel = interaction.options.getChannel('قناة');
        await db.setConfig('identity_admin_role', role.id);
        await db.setConfig('identity_log_channel', channel.id);

        const _img = await db.getImage('identity').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('Identity Admins Set')
            .setColor(0xE53935)
            .addFields(
                { name: '🛡️ الRank المسؤولة', value: `<@&${role.id}> — \`${role.name}\``, inline: true },
                { name: '📋 قناة اللوق',        value: `<#${channel.id}>`, inline: true },
            )
            .setFooter({ text: 'Identity System • FANTASY Bot' })
            .setTimestamp();
        if (_img) embed.setImage(_img);
        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '​', flags: 64 });
    }
};
