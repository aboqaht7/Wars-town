const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'إدارة-سرقة',
    data: new SlashCommandBuilder()
        .setName('إدارة-سرقة')
        .setDescription('إدارة السرقات (أدمن فقط)')
        .addSubcommand(sub => sub
            .setName('اضافة')
            .setDescription('إضافة سرقة جديدة')
            .addStringOption(o => o.setName('اسم').setDescription('اسم السرقة').setRequired(true))
            .addStringOption(o => o.setName('ادوات').setDescription('الأدوات المطلوبة مفصولة بفاصلة ( , ) — اكتب لا يوجد إذا ما في أدوات').setRequired(true))
            .addIntegerOption(o => o.setName('حد-ادنى').setDescription('الحد الأدنى للمبلغ (ريال)').setRequired(true).setMinValue(0))
            .addIntegerOption(o => o.setName('حد-اعلى').setDescription('الحد الأعلى للمبلغ (ريال)').setRequired(true).setMinValue(0))
        )
        .addSubcommand(sub => sub
            .setName('حذف')
            .setDescription('حذف سرقة بالرقم التعريفي')
            .addIntegerOption(o => o.setName('رقم').setDescription('رقم السرقة (يظهر في قائمة السرقات)').setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName('قائمة')
            .setDescription('عرض جميع السرقات المضافة')
        ),

    async slashExecute(interaction, db) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'اضافة') {
            const name     = interaction.options.getString('اسم').trim();
            const tools    = interaction.options.getString('ادوات').trim();
            const minMoney = interaction.options.getInteger('حد-ادنى');
            const maxMoney = interaction.options.getInteger('حد-اعلى');

            if (maxMoney < minMoney) return interaction.reply({ content: '❌ الحد الأعلى يجب أن يكون أكبر من الحد الأدنى.', flags: 64 });

            const row = await db.addRobbery(name, tools, minMoney, maxMoney);
            const embed = new EmbedBuilder()
                .setTitle('✅ تمت إضافة السرقة')
                .setColor(0xB71C1C)
                .addFields(
                    { name: '🔖 الرقم',            value: `\`${row.id}\``, inline: true },
                    { name: '💰 اسم السرقة',        value: name, inline: true },
                    { name: '🛠️ الأدوات المطلوبة', value: `\`${tools}\``, inline: false },
                    { name: '💵 المبلغ',            value: `\`${minMoney.toLocaleString()}\` — \`${maxMoney.toLocaleString()}\` ريال`, inline: true },
                )
                .setFooter({ text: 'نظام السرقات • بوت FANTASY' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'حذف') {
            const id = interaction.options.getInteger('رقم');
            const rob = await db.getRobberyById(id);
            if (!rob) return interaction.reply({ content: `❌ لا توجد سرقة برقم \`${id}\`.`, flags: 64 });
            await db.deleteRobbery(id);
            const embed = new EmbedBuilder()
                .setTitle('🗑️ تم حذف السرقة')
                .setColor(0x757575)
                .setDescription(`تم حذف سرقة **${rob.name}** بنجاح.`)
                .setFooter({ text: 'نظام السرقات • بوت FANTASY' })
                .setTimestamp();
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'قائمة') {
            const robberies = await db.getRobberies();
            const embed = new EmbedBuilder()
                .setTitle('📋 قائمة السرقات')
                .setColor(0xB71C1C)
                .setFooter({ text: `${robberies.length} سرقة • بوت FANTASY` })
                .setTimestamp();
            if (!robberies.length) {
                embed.setDescription('> لا توجد سرقات مضافة بعد.');
            } else {
                embed.setDescription(robberies.map(r =>
                    `**\`#${r.id}\` ${r.name}**\n🛠️ \`${r.tools}\`\n💵 \`${Number(r.min_money).toLocaleString()}\` — \`${Number(r.max_money).toLocaleString()}\` ريال`
                ).join('\n\n'));
            }
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }
    }
};
