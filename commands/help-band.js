const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'help-band',
    data: new SlashCommandBuilder()
        .setName('help-band')
        .setDescription('قائمة أوامر التشهير والطرد النهائي'),

    async slashExecute(interaction, db) {
        await interaction.reply({ content: '⏳', flags: 64 });

        const text = [
            '**🚫 أوامر التشهير — الطرد النهائي من السيرفر**',
            '',
            '`-بنعالي @اللاعب`',
            '`-شقلب @اللاعب`',
            '`-تفوو @اللاعب`',
            '`-بنعال-ابو-قحط @اللاعب`',
            '`-بنعال-عسيري @اللاعب`',
            '`-بنعال-الشريف @اللاعب`',
            '`-بنعال-مشاري @اللاعب`',
            '',
            '> جميع الأوامر للإدارة فقط — يُطرد اللاعب نهائياً من السيرفر فور التنفيذ.',
        ].join('\n');

        await interaction.channel.send(text);
    }
};
