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
        .setDescription('Manage Ticket System')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('إضافة-نوع')
                .setDescription('Add a new ticket type')
                .addStringOption(o => o.setName('الاسم').setDescription('Type name (e.g. Complaint)').setRequired(true))
                .addStringOption(o => o.setName('الإيموجي').setDescription('Emoji for this type (e.g. 📝)').setRequired(false))
                .addRoleOption(o => o.setName('الرتبة').setDescription('Role that receives this ticket (optional)').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('حذف-نوع')
                .setDescription('Delete a ticket type')
                .addIntegerOption(o => o.setName('الرقم').setDescription('Type ID (from the list)').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('قائمة')
                .setDescription('List all ticket types')
        )
        .addSubcommand(sub =>
            sub.setName('فئة')
                .setDescription('Set the category channel for ticket rooms')
                .addChannelOption(o => o.setName('الفئة').setDescription('Category channel').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('لوق')
                .setDescription('Set the ticket log channel')
                .addChannelOption(o => o.setName('الروم').setDescription('Log channel').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('مسؤولين')
                .setDescription('Set the ticket admin role (only they can close tickets)')
                .addRoleOption(o => o.setName('الرتبة').setDescription('Ticket admin role').setRequired(true))
        )
        ,

    async slashExecute(interaction, db) {
        await interaction.deferReply({ flags: 64 });
        const sub = interaction.options.getSubcommand();

        if (sub === 'إضافة-نوع') {
            const name     = interaction.options.getString('الاسم').trim();
            const rawEmoji = interaction.options.getString('الإيموجي')?.trim() || '🎫';
            const emoji    = await resolveEmoji(rawEmoji, interaction.guild);
            const role     = interaction.options.getRole('الرتبة');
            const type     = await db.addTicketType(name, emoji, role?.id || null);
            const fields   = [
                { name: '🆔 ID',   value: `\`${type.id}\``, inline: true },
                { name: '🎫 Type', value: `${type.emoji} ${type.name}`, inline: true },
            ];
            if (role) fields.push({ name: '🛡️ Assigned Role', value: `<@&${role.id}>`, inline: true });
            const _img = await db.getImage('tickets').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Ticket Type Added')
                .setColor(0x1565C0)
                .addFields(...fields)
                .setFooter({ text: 'Ticket System • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.deleteReply().catch(() => {});
        }

        if (sub === 'حذف-نوع') {
            const id      = interaction.options.getInteger('الرقم');
            const deleted = await db.removeTicketType(id);
            if (!deleted) return interaction.editReply({ content: `❌ No type found with ID \`${id}\`.` });
            const _img = await db.getImage('tickets').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Ticket Type Deleted')
                .setColor(0xB71C1C)
                .setDescription(`Type **${deleted.emoji} ${deleted.name}** has been deleted.`)
                .setFooter({ text: 'Ticket System • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.deleteReply().catch(() => {});
        }

        if (sub === 'قائمة') {
            const types = await db.getTicketTypes();
            const _img  = await db.getImage('tickets').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Ticket Types')
                .setColor(0x37474F)
                .setFooter({ text: 'Ticket System • FANTASY Bot' }).setTimestamp();
            if (!types.length) {
                embed.setDescription('> No types found. Use `/إعداد-تكتات إضافة-نوع` to add one.');
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
            return interaction.deleteReply().catch(() => {});
        }

        if (sub === 'فئة') {
            const cat = interaction.options.getChannel('الفئة');
            await db.setConfig('ticket_category_id', cat.id);
            const _img = await db.getImage('tickets').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Ticket Category Set')
                .setColor(0x1565C0)
                .addFields({ name: '📁 Category', value: `**${cat.name}**`, inline: true })
                .setFooter({ text: 'Ticket System • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.deleteReply().catch(() => {});
        }

        if (sub === 'لوق') {
            const ch = interaction.options.getChannel('الروم');
            await db.setConfig('ticket_log_channel', ch.id);
            const _img = await db.getImage('tickets').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Ticket Log Channel Set')
                .setColor(0x1565C0)
                .addFields({ name: '📋 Channel', value: `<#${ch.id}>`, inline: true })
                .setFooter({ text: 'Ticket System • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.deleteReply().catch(() => {});
        }

        if (sub === 'مسؤولين') {
            const role = interaction.options.getRole('الرتبة');
            await db.setConfig('ticket_admin_role', role.id);
            const _img = await db.getImage('tickets').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Ticket Admin Role Set')
                .setColor(0x7B1FA2)
                .addFields(
                    { name: '🛡️ Role',       value: `<@&${role.id}>`, inline: true },
                    { name: 'ℹ️ Permission', value: 'Only members with this role can close tickets.', inline: false },
                )
                .setFooter({ text: 'Ticket System • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            await interaction.channel.send({ embeds: [embed] });
            return interaction.deleteReply().catch(() => {});
        }
    }
};
