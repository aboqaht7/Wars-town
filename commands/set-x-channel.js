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
        const _img = await db.getImage('x_platform').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('Tweets Channel Set')
            .setColor(0x000000)
            .setDescription(`ستُنشر جميع التغريدات في <#${channel.id}> automatically.`)
            .setFooter({ text: 'X Platform • FANTASY Bot' })
            .setTimestamp();
        if (_img) embed.setImage(_img);
        message.channel.send({ embeds: [embed] });
    },
    async slashExecute(interaction, db) {
        const channel = interaction.options.getChannel('روم');
        await db.setConfig('x_channel', channel.id);
        const _img = await db.getImage('x_platform').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('Tweets Channel Set')
            .setColor(0x000000)
            .setDescription(`ستُنشر جميع التغريدات في <#${channel.id}> automatically.`)
            .setFooter({ text: 'X Platform • FANTASY Bot' })
            .setTimestamp();
        if (_img) embed.setImage(_img);
        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: '​', flags: 64 });
    }
};
