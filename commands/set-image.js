const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'set-image',
    data: new SlashCommandBuilder()
        .setName('set-image')
        .setDescription('تعيين صورة لأي نظام')
        .addStringOption(option => option.setName('system').setDescription('اختر النظام').setRequired(true))
        .addStringOption(option => option.setName('url').setDescription('رابط الصورة').setRequired(true)),
    async execute(message, args, db) {
        const system = args[0];
        const url = args[1];
        await db.setImage(system, url);
        message.channel.send(`تم تعيين الصورة للنظام: ${system}`);
    },
    async slashExecute(interaction, db) {
        const system = interaction.options.getString('system');
        const url = interaction.options.getString('url');
        await db.setImage(system, url);
        interaction.reply({ content: `تم تعيين الصورة للنظام: ${system}`, flags: 64 });
    }
};
