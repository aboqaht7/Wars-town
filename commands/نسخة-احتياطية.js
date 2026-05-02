const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendBackupToChannel } = require('../backup');

module.exports = {
    name: 'نسخة-احتياطية',
    data: new SlashCommandBuilder()
        .setName('نسخة-احتياطية')
        .setDescription('إنشاء نسخة احتياطية فورية للداتابيس وإرسالها لروم النسخ الاحتياطية')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async slashExecute(interaction, db) {
        await interaction.reply({ content: 'جارٍ إنشاء النسخة الاحتياطية...', flags: 64 });
        try {
            const result = await sendBackupToChannel(interaction.client, db, { auto: false });
            const sizeMB = (result.size / 1024 / 1024).toFixed(2);
            await interaction.editReply({ content: `تم إنشاء النسخة الاحتياطية وإرسالها (${sizeMB} MB).` });
        } catch (e) {
            await interaction.editReply({ content: `فشل إنشاء النسخة: ${e.message}` });
        }
    }
};
