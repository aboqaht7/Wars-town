const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'مسؤولين-الهوية',
    data: new SlashCommandBuilder()
        .setName('مسؤولين-الهوية')
        .setDescription('تعيين رتبة مسؤولي الهوية وقناة لوق الهويات')
        .addRoleOption(opt =>
            opt.setName('رتبة').setDescription('رتبة مسؤولي الهوية').setRequired(true))
        .addChannelOption(opt =>
            opt.setName('قناة').setDescription('قناة لوق الهويات (حيث تصل طلبات القبول/الرفض)').setRequired(true)),

    async slashExecute(interaction, db) {
        const role    = interaction.options.getRole('رتبة');
        const channel = interaction.options.getChannel('قناة');
        await db.setConfig('identity_admin_role', role.id);
        await db.setConfig('identity_log_channel', channel.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ تم تعيين مسؤولي الهوية')
            .setColor(0x1565C0)
            .addFields(
                { name: '🛡️ الرتبة المسؤولة', value: `<@&${role.id}> — \`${role.name}\``, inline: true },
                { name: '📋 قناة اللوق',        value: `<#${channel.id}>`, inline: true },
            )
            .setFooter({ text: 'نظام الهوية • بوت FANTASY' })
            .setTimestamp();
        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '​', flags: 64 });
    }
};
