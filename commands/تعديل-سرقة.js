const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'تعديل-سرقة',
    data: new SlashCommandBuilder()
        .setName('تعديل-سرقة')
        .setDescription('تعديل سرقة موجودة (أدمن فقط)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addIntegerOption(o => o.setName('رقم').setDescription('رقم السرقة').setRequired(true))
        .addStringOption(o => o.setName('اسم').setDescription('الاسم الجديد').setRequired(false))
        .addStringOption(o => o.setName('ادوات').setDescription('الأدوات الجديدة مفصولة بفاصلة').setRequired(false))
        .addIntegerOption(o => o.setName('حد-ادنى').setDescription('الحد الأدنى الجديد للمبلغ').setRequired(false).setMinValue(0))
        .addIntegerOption(o => o.setName('حد-اعلى').setDescription('الحد الأعلى الجديد للمبلغ').setRequired(false).setMinValue(0)),

    async slashExecute(interaction, db) {
        const id       = interaction.options.getInteger('رقم');
        const name     = interaction.options.getString('اسم')     ?? undefined;
        const tools    = interaction.options.getString('ادوات')   ?? undefined;
        const minMoney = interaction.options.getInteger('حد-ادنى') ?? undefined;
        const maxMoney = interaction.options.getInteger('حد-اعلى') ?? undefined;

        if ([name, tools, minMoney, maxMoney].every(v => v === undefined)) {
            return interaction.reply({ content: '❌ يجب تعديل حقل واحد على الأقل.', flags: 64 });
        }

        const existing = await db.getRobberyById(id);
        if (!existing) return interaction.reply({ content: `❌ لا توجد سرقة برقم \`${id}\`.`, flags: 64 });

        if (maxMoney !== undefined && minMoney !== undefined && maxMoney < minMoney) {
            return interaction.reply({ content: '❌ الحد الأعلى يجب أن يكون أكبر من الحد الأدنى.', flags: 64 });
        }
        const resolvedMin = minMoney ?? Number(existing.min_money);
        const resolvedMax = maxMoney ?? Number(existing.max_money);
        if (resolvedMax < resolvedMin) {
            return interaction.reply({ content: '❌ الحد الأعلى يجب أن يكون أكبر من الحد الأدنى.', flags: 64 });
        }

        const updated = await db.updateRobbery(id, { name, tools, minMoney, maxMoney });

        const embed = new EmbedBuilder()
            .setTitle('✅ تم تعديل السرقة')
            .setColor(0xB71C1C)
            .addFields(
                { name: '🔖 الرقم',            value: `\`${updated.id}\``, inline: true },
                { name: '💰 الاسم',            value: updated.name, inline: true },
                { name: '🛠️ الأدوات',          value: `\`${updated.tools}\``, inline: false },
                { name: '💵 المبلغ',            value: `\`${Number(updated.min_money).toLocaleString()}\` — \`${Number(updated.max_money).toLocaleString()}\` ريال`, inline: true },
            )
            .setFooter({ text: 'نظام السرقات • بوت FANTASY' })
            .setTimestamp();
        return interaction.reply({ embeds: [embed] });
    }
};
