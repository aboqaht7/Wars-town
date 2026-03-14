const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'set-x-channel',
    data: new SlashCommandBuilder()
        .setName('set-x-channel')
        .setDescription('تحديد روم نشر التغريدات')
        .addChannelOption(opt =>
            opt.setName('روم').setDescription('الروم الذي ستُنشر فيه التغريدات').setRequired(true)
        ),
    async execute(message, args, db) {
        const channel = message.mentions.channels.first();
        if (!channel) return message.reply('❌ حدد الروم. مثال: `-set-x-channel #الروم`');
        await db.setConfig('x_channel', channel.id);
        message.channel.send(`✅ تم تحديد روم التغريدات: <#${channel.id}>`);
    },
    async slashExecute(interaction, db) {
        const channel = interaction.options.getChannel('روم');
        await db.setConfig('x_channel', channel.id);
        const embed = new EmbedBuilder()
            .setTitle('✅ تم تحديد روم التغريدات')
            .setColor(0x000000)
            .addFields({ name: '📢 الروم', value: `<#${channel.id}>`, inline: true })
            .setFooter({ text: 'منصة X • بوت FANTASY' })
            .setTimestamp();
        interaction.reply({ embeds: [embed] });
    }
};
