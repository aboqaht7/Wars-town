const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'تعديل-سرقة',
    data: new SlashCommandBuilder()
        .setName('تعديل-سرقة')
        .setDescription('تعديل سرقة موجودة (أدمن فقط)')
        .addStringOption(o => o.setName('اسم-السرقة').setDescription('اسم السرقة المراد تعديلها').setRequired(true))
        .addStringOption(o => o.setName('اسم-جديد').setDescription('الاسم الجديد للسرقة').setRequired(false))
        .addStringOption(o => o.setName('ادوات').setDescription('الأدوات الجديدة مفصولة بفاصلة').setRequired(false))
        .addIntegerOption(o => o.setName('حد-ادنى').setDescription('الحد الأدنى الجديد للمبلغ').setRequired(false).setMinValue(0))
        .addIntegerOption(o => o.setName('حد-اعلى').setDescription('الحد الأعلى الجديد للمبلغ').setRequired(false).setMinValue(0)),

    async slashExecute(interaction, db) {
        const searchName = interaction.options.getString('اسم-السرقة').trim();
        const newName    = interaction.options.getString('اسم-جديد')  ?? undefined;
        const tools      = interaction.options.getString('ادوات')      ?? undefined;
        const minMoney   = interaction.options.getInteger('حد-ادنى')   ?? undefined;
        const maxMoney   = interaction.options.getInteger('حد-اعلى')   ?? undefined;

        if ([newName, tools, minMoney, maxMoney].every(v => v === undefined)) {
            return interaction.reply({ content: '❌ يجب تعديل حقل واحد على الأقل.', flags: 64 });
        }

        const existing = await db.getRobberyByName(searchName);
        if (!existing) return interaction.reply({ content: `❌ لا توجد سرقة باسم **${searchName}**.`, flags: 64 });

        const resolvedMin = minMoney ?? Number(existing.min_money);
        const resolvedMax = maxMoney ?? Number(existing.max_money);
        if (resolvedMax < resolvedMin) {
            return interaction.reply({ content: '❌ الحد الأعلى يجب أن يكون أكبر من الحد الأدنى.', flags: 64 });
        }

        const updated = await db.updateRobbery(existing.id, { name: newName, tools, minMoney, maxMoney });

        const embed = new EmbedBuilder()
            .setTitle('✅ تم تعديل السرقة')
            .setColor(0xB71C1C)
            .addFields(
                { name: '🔖 الرقم',   value: `\`${updated.id}\``, inline: true },
                { name: '🔫 الاسم',   value: updated.name, inline: true },
                { name: '🛠️ الأدوات', value: `\`${updated.tools}\``, inline: false },
                { name: '💵 المبلغ',  value: `\`${Number(updated.min_money).toLocaleString()}\` — \`${Number(updated.max_money).toLocaleString()}\` ريال`, inline: true },
            )
            .setFooter({ text: 'نظام السرقات • بوت FANTASY' })
            .setTimestamp();
        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: '​', flags: 64 });
    }
};
