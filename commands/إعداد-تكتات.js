const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

async function resolveEmoji(rawEmoji, guild) {
    if (!rawEmoji) return null;
    const fullMatch = rawEmoji.match(/^<(a?):(\w+):(\d+)>$/);
    if (fullMatch) return rawEmoji;
    const nameOnly = rawEmoji.replace(/^:|:$/g, '').trim();
    if (nameOnly && guild) {
        try {
            const emojis = await guild.emojis.fetch();
            const found = emojis.find(e => e.name === nameOnly);
            if (found) return `<${found.animated ? 'a' : ''}:${found.name}:${found.id}>`;
        } catch (_) {}
    }
    return rawEmoji;
}

module.exports = {
    name: 'إعداد-تكتات',
    data: new SlashCommandBuilder()
        .setName('إعداد-تكتات')
        .setDescription('إدارة نظام التكتات')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('إضافة-نوع')
                .setDescription('إضافة نوع تكت جديد')
                .addStringOption(o => o.setName('الاسم').setDescription('اسم النوع (مثال: شكوى)').setRequired(true))
                .addStringOption(o => o.setName('الإيموجي').setDescription('إيموجي النوع (مثال: 📝)').setRequired(false))
                .addRoleOption(o => o.setName('الرتبة').setDescription('الرتبة التي تستلم هذا التكت (اختياري)').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('حذف-نوع')
                .setDescription('حذف نوع تكت')
                .addIntegerOption(o => o.setName('الرقم').setDescription('رقم النوع (من قائمة الأنواع)').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('قائمة')
                .setDescription('عرض جميع أنواع التكتات')
        )
        .addSubcommand(sub =>
            sub.setName('فئة')
                .setDescription('تعيين فئة الروم لإنشاء التكتات فيها')
                .addChannelOption(o => o.setName('الفئة').setDescription('فئة الروم (Category)').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('لوق')
                .setDescription('تعيين روم تسجيل أحداث التكتات')
                .addChannelOption(o => o.setName('الروم').setDescription('روم اللوق').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('مسؤولين')
                .setDescription('تعيين رتبة مسؤولين التكتات (الوحيدون القادرون على الإغلاق)')
                .addRoleOption(o => o.setName('الرتبة').setDescription('رتبة مسؤولي التكتات').setRequired(true))
        )
        ,

    async slashExecute(interaction, db) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'إضافة-نوع') {
            const name   = interaction.options.getString('الاسم').trim();
            const rawEmoji = interaction.options.getString('الإيموجي')?.trim() || '🎫';
            const emoji  = await resolveEmoji(rawEmoji, interaction.guild);
            const role   = interaction.options.getRole('الرتبة');
            const type   = await db.addTicketType(name, emoji, role?.id || null);
            const fields = [
                { name: '🆔 الرقم', value: `\`${type.id}\``, inline: true },
                { name: '🎫 الاسم', value: `${type.emoji} ${type.name}`, inline: true },
            ];
            if (role) fields.push({ name: '🛡️ الرتبة المستلِمة', value: `<@&${role.id}>`, inline: true });
            const _img = await db.getImage('tickets').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Ticket Type Added')
                .setColor(0x1565C0)
                .addFields(...fields)
                .setFooter({ text: 'نظام التكتات • بوت FANTASY' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'حذف-نوع') {
            const id      = interaction.options.getInteger('الرقم');
            const deleted = await db.removeTicketType(id);
            if (!deleted) return interaction.reply({ content: `❌ لا يوجد نوع برقم \`${id}\`.`, flags: 64 });
            const _img = await db.getImage('tickets').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('تم حذف نوع التكت')
                .setColor(0xB71C1C)
                .setDescription(`تم حذف نوع **${deleted.emoji} ${deleted.name}** بنجاح.`)
                .setFooter({ text: 'نظام التكتات • بوت FANTASY' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'قائمة') {
            const types = await db.getTicketTypes();
            const _img = await db.getImage('tickets').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Ticket Types')
                .setColor(0x37474F)
                .setFooter({ text: 'نظام التكتات • بوت FANTASY' }).setTimestamp();
            if (!types.length) {
                embed.setDescription('> لا توجد أنواع. استخدم `/إعداد-تكتات إضافة-نوع` لإضافة نوع.');
            } else {
                embed.setDescription(
                    types.map(t =>
                        `\`${t.id}\` • ${t.emoji} **${t.name}**` +
                        (t.role_id ? ` — <@&${t.role_id}>` : '')
                    ).join('\n')
                );
            }
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'فئة') {
            const cat = interaction.options.getChannel('الفئة');
            await db.setConfig('ticket_category_id', cat.id);
            const _img = await db.getImage('tickets').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('تم تعيين فئة التكتات')
                .setColor(0x1565C0)
                .addFields({ name: '📁 الفئة', value: `**${cat.name}**`, inline: true })
                .setFooter({ text: 'نظام التكتات • بوت FANTASY' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'لوق') {
            const ch = interaction.options.getChannel('الروم');
            await db.setConfig('ticket_log_channel', ch.id);
            const _img = await db.getImage('tickets').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('تم تعيين روم لوق التكتات')
                .setColor(0x1565C0)
                .addFields({ name: '📋 الروم', value: `<#${ch.id}>`, inline: true })
                .setFooter({ text: 'نظام التكتات • بوت FANTASY' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }

        if (sub === 'مسؤولين') {
            const role = interaction.options.getRole('الرتبة');
            await db.setConfig('ticket_admin_role', role.id);
            const _img = await db.getImage('tickets').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Ticket Admins Role Set')
                .setColor(0x7B1FA2)
                .addFields(
                    { name: '🛡️ الرتبة', value: `<@&${role.id}>`, inline: true },
                    { name: 'ℹ️ الصلاحية', value: 'فقط أصحاب هذه الرتبة يقدرون يغلقون التكتات', inline: false },
                )
                .setFooter({ text: 'نظام التكتات • بوت FANTASY' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '​', flags: 64 });
        }

    }
};
