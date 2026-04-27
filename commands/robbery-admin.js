const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'إدارة-سرقة',
    data: new SlashCommandBuilder()
        .setName('إدارة-سرقة')
        .setDescription('Manage robberies (admin only)')
        .addSubcommand(sub => sub
            .setName('اضافة')
            .setDescription('Add a new robbery')
            .addStringOption(o => o.setName('اسم').setDescription('Robbery name').setRequired(true))
            .addStringOption(o => o.setName('ادوات').setDescription('Required tools separated by commas — type "none" if no tools needed').setRequired(true))
            .addIntegerOption(o => o.setName('حد-ادنى').setDescription('Minimum amount (Riyals)').setRequired(true).setMinValue(0))
            .addIntegerOption(o => o.setName('حد-اعلى').setDescription('Maximum amount (Riyals)').setRequired(true).setMinValue(0))
        )
        .addSubcommand(sub => sub
            .setName('حذف')
            .setDescription('Delete a robbery by its ID')
            .addIntegerOption(o => o.setName('رقم').setDescription('Robbery ID (shown in the robbery list)').setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName('قائمة')
            .setDescription('View all added robberies')
        ),

    async slashExecute(interaction, db) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'اضافة') {
            const name     = interaction.options.getString('اسم').trim();
            const tools    = interaction.options.getString('ادوات').trim();
            const minMoney = interaction.options.getInteger('حد-ادنى');
            const maxMoney = interaction.options.getInteger('حد-اعلى');

            if (maxMoney < minMoney) return interaction.reply({ content: '❌ Maximum must be greater than minimum.', flags: 64 });

            const row = await db.addRobbery(name, tools, minMoney, maxMoney);
            const _img = await db.getImage('crime').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Robbery Added')
                .setColor(0xB71C1C)
                .addFields(
                    { name: '🔖 ID',              value: `\`${row.id}\``, inline: true },
                    { name: '💰 Name',             value: name, inline: true },
                    { name: '🛠️ Required Tools',  value: `\`${tools}\``, inline: false },
                    { name: '💵 Amount Range',     value: `\`${minMoney.toLocaleString()}\` — \`${maxMoney.toLocaleString()}\` Riyals`, inline: true },
                )
                .setFooter({ text: 'Robbery System • FANTASY Bot' })
                .setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'حذف') {
            const id = interaction.options.getInteger('رقم');
            const rob = await db.getRobberyById(id);
            if (!rob) return interaction.reply({ content: `❌ No robbery found with ID \`${id}\`.`, flags: 64 });
            await db.deleteRobbery(id);
            const _img = await db.getImage('crime').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Robbery Deleted')
                .setColor(0x757575)
                .setDescription(`Robbery **${rob.name}** has been deleted successfully.`)
                .setFooter({ text: 'Robbery System • FANTASY Bot' })
                .setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'قائمة') {
            const robberies = await db.getRobberies();
            const _img = await db.getImage('crime').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Robbery List')
                .setColor(0xB71C1C)
                .setFooter({ text: `${robberies.length} robbery(s) • FANTASY Bot` })
                .setTimestamp();
            if (!robberies.length) {
                embed.setDescription('> No robberies added yet.');
            } else {
                embed.setDescription(robberies.map(r =>
                    `**\`#${r.id}\` ${r.name}**\n🛠️ \`${r.tools}\`\n💵 \`${Number(r.min_money).toLocaleString()}\` — \`${Number(r.max_money).toLocaleString()}\` Riyals`
                ).join('\n\n'));
            }
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }
    }
};
