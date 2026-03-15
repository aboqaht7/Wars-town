const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'x-روم',
    data: new SlashCommandBuilder()
        .setName('x-روم')
        .setDescription('تحديد روم نشر التغريدات (يُكتب مرة واحدة فقط)')
        .addChannelOption(opt =>
            opt.setName('روم').setDescription('الروم الذي ستُنشر فيه التغريدات').setRequired(true)
        ),
    async execute(message, args, db) {
        const channel = message.mentions.channels.first();
        if (!channel) return message.reply('❌ اذكر الروم. مثال: `-x-روم #اسم-الروم`');
        await db.setConfig('x_channel', channel.id);
        const embed = new EmbedBuilder()
            .setTitle('✅ تم تحديد روم التغريدات')
            .setColor(0x000000)
            .setDescription(`ستُنشر جميع التغريدات في <#${channel.id}> تلقائياً.`)
            .setFooter({ text: 'منصة X • بوت FANTASY' })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    },
    async slashExecute(interaction, db) {
        const channel = interaction.options.getChannel('روم');
        await db.setConfig('x_channel', channel.id);
        const embed = new EmbedBuilder()
            .setTitle('✅ تم تحديد روم التغريدات')
            .setColor(0x000000)
            .setDescription(`ستُنشر جميع التغريدات في <#${channel.id}> تلقائياً.`)
            .setFooter({ text: 'منصة X • بوت FANTASY' })
            .setTimestamp();
        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: '​', flags: 64 });
    }
};
