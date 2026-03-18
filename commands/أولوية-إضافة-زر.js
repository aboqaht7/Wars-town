const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'أولوية-إضافة-زر',
    data: new SlashCommandBuilder()
        .setName('أولوية-إضافة-زر')
        .setDescription('إضافة زر جديد لنظام الأولوية')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt =>
            opt.setName('اسم-الزر')
                .setDescription('النص الظاهر على الزر')
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('الأولوية')
                .setDescription('نص الأولوية المرسل عند الضغط')
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('اللون')
                .setDescription('لون الزر')
                .setRequired(true)
                .addChoices(
                    { name: '🔵 أزرق', value: 'Primary' },
                    { name: '⚫ رمادي', value: 'Secondary' },
                    { name: '🟢 أخضر', value: 'Success' },
                    { name: '🔴 أحمر', value: 'Danger' },
                )
        ),

    async slashExecute(interaction, db) {
        const label    = interaction.options.getString('اسم-الزر');
        const priority = interaction.options.getString('الأولوية');
        const style    = interaction.options.getString('اللون');

        const btn = await db.addPriorityButton(label, priority, style);
        await interaction.reply({
            content: `✅ تم إضافة زر الأولوية:\n> 🏷️ **${label}** — أولوية: **${priority}** — لون: **${style}** (ID: ${btn.id})`,
            flags: 64
        });
    }
};
