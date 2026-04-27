const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'أولوية-حذف-زر',
    data: new SlashCommandBuilder()
        .setName('أولوية-حذف-زر')
        .setDescription('حذف زر من نظام الأولوية')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addIntegerOption(opt =>
            opt.setName('رقم-الزر')
                .setDescription('رقم (ID) الزر المراد حذفه')
                .setRequired(true)
        ),

    async slashExecute(interaction, db) {
        const id = interaction.options.getInteger('رقم-الزر');
        const removed = await db.removePriorityButton(id);
        if (!removed)
            return interaction.reply({ content: `❌ No priority button found with ID ${id}.`, flags: 64 });

        await interaction.reply({
            content: `🗑️ Priority button deleted: **${removed.label}**`,
            flags: 64
        });
    }
};
