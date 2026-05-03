const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType,
} = require('discord.js');

async function resolveEmoji(rawEmoji, guild) {
    if (!rawEmoji) return null;
    if (/^<a?:\w+:\d+>$/.test(rawEmoji)) return rawEmoji;
    const name = rawEmoji.replace(/^:|:$/g, '').trim();
    if (name && guild) {
        try {
            const emojis = await guild.emojis.fetch();
            const found  = emojis.find(e => e.name === name);
            if (found) return `<${found.animated ? 'a' : ''}:${found.name}:${found.id}>`;
        } catch (_) {}
    }
    return rawEmoji;
}

module.exports = {
    name: 'إعداد-تكتات',
    data: new SlashCommandBuilder()
        .setName('إعداد-تكتات')
        .setDescription('Ticket System Setup')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        // Add a ticket type
        .addSubcommand(sub =>
            sub.setName('إضافة-نوع')
                .setDescription('Add a new ticket type')
                .addStringOption(o =>
                    o.setName('الاسم').setDescription('Type name').setRequired(true))
                .addStringOption(o =>
                    o.setName('الإيموجي').setDescription('Emoji (e.g. 📝)').setRequired(false))
                .addRoleOption(o =>
                    o.setName('الرتبة').setDescription('Role notified when this ticket is opened').setRequired(false))
                .addChannelOption(o =>
                    o.setName('الفئة').setDescription('Category where this ticket type opens (overrides default)').setRequired(false)
                        .addChannelTypes(ChannelType.GuildCategory))
        )

        // Delete a ticket type
        .addSubcommand(sub =>
            sub.setName('حذف-نوع')
                .setDescription('Delete a ticket type by ID')
                .addIntegerOption(o =>
                    o.setName('الرقم').setDescription('Type ID (from /إعداد-تكتات قائمة)').setRequired(true))
        )

        // List all ticket types
        .addSubcommand(sub =>
            sub.setName('قائمة')
                .setDescription('List all ticket types')
        )

        // Set default category for all tickets
        .addSubcommand(sub =>
            sub.setName('فئة')
                .setDescription('Set the default category channel for new ticket rooms')
                .addChannelOption(o =>
                    o.setName('الفئة').setDescription('Category channel').setRequired(true)
                        .addChannelTypes(ChannelType.GuildCategory))
        )

        // Set log channel
        .addSubcommand(sub =>
            sub.setName('لوق')
                .setDescription('Set the ticket log channel')
                .addChannelOption(o =>
                    o.setName('الروم').setDescription('Log channel').setRequired(true))
        )

        // Set ticket admin role
        .addSubcommand(sub =>
            sub.setName('مسؤولين')
                .setDescription('Set the ticket admin role (can close tickets)')
                .addRoleOption(o =>
                    o.setName('الرتبة').setDescription('Admin role').setRequired(true))
        ),

    async slashExecute(interaction, db) {
        try { await interaction.deferReply({ flags: 64 }); } catch { return; }
        const sub = interaction.options.getSubcommand();

        // ── إضافة نوع ───────────────────────────────────────────────────────
        if (sub === 'إضافة-نوع') {
            const name       = interaction.options.getString('الاسم').trim();
            const rawEmoji   = interaction.options.getString('الإيموجي')?.trim() || '🎫';
            const emoji      = await resolveEmoji(rawEmoji, interaction.guild);
            const role       = interaction.options.getRole('الرتبة');
            const catChannel = interaction.options.getChannel('الفئة');

            const type = await db.addTicketType(
                name,
                emoji,
                role?.id       || null,
                catChannel?.id || null
            );

            const embed = new EmbedBuilder()
                .setTitle('✅ Ticket Type Added')
                .setColor(0xE53935)
                .addFields(
                    { name: '🆔 ID',    value: `\`${type.id}\``,               inline: true },
                    { name: '🎫 Type',  value: `${type.emoji} ${type.name}`,   inline: true },
                    { name: '\u200b',   value: '\u200b',                        inline: true },
                    { name: '🛡️ Role',    value: role       ? `<@&${role.id}>`       : '—', inline: true },
                    { name: '📁 Category', value: catChannel ? `**${catChannel.name}**` : '_(uses default)_', inline: true },
                )
                .setFooter({ text: 'Ticket System • FANTASY Bot' })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        // ── حذف نوع ─────────────────────────────────────────────────────────
        if (sub === 'حذف-نوع') {
            const id      = interaction.options.getInteger('الرقم');
            const deleted = await db.removeTicketType(id);
            if (!deleted)
                return interaction.editReply({ content: `❌ No ticket type found with ID \`${id}\`. Use \`/إعداد-تكتات قائمة\` to see available IDs.` });

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Ticket Type Deleted')
                .setColor(0xE53935)
                .setDescription(`Type **${deleted.emoji} ${deleted.name}** (ID: \`${deleted.id}\`) has been deleted.`)
                .setFooter({ text: 'Ticket System • FANTASY Bot' })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        // ── قائمة الأنواع ───────────────────────────────────────────────────
        if (sub === 'قائمة') {
            const types          = await db.getTicketTypes();
            const defaultCatId   = await db.getConfig('ticket_category_id').catch(() => null);
            const logChannelId   = await db.getConfig('ticket_log_channel').catch(() => null);
            const adminRoleId    = await db.getConfig('ticket_admin_role').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('🎫 Ticket System — Current Setup')
                .setColor(0xE53935)
                .setFooter({ text: 'Ticket System • FANTASY Bot' })
                .setTimestamp();

            // Settings summary
            const settings = [
                `📁 **Default Category:** ${defaultCatId ? `<#${defaultCatId}>` : '❌ Not set'}`,
                `📋 **Log Channel:** ${logChannelId ? `<#${logChannelId}>` : '❌ Not set'}`,
                `🛡️ **Admin Role:** ${adminRoleId ? `<@&${adminRoleId}>` : '❌ Not set'}`,
            ].join('\n');
            embed.addFields({ name: '⚙️ Settings', value: settings });

            // Types list
            if (!types.length) {
                embed.addFields({ name: '📂 Ticket Types', value: '> No types yet. Use `/إعداد-تكتات إضافة-نوع` to add one.' });
            } else {
                const list = types.map(t => {
                    let line = `\`${t.id}\` ${t.emoji} **${t.name}**`;
                    if (t.role_id)     line += ` • 🛡️ <@&${t.role_id}>`;
                    if (t.category_id) line += ` • 📁 <#${t.category_id}>`;
                    return line;
                }).join('\n');
                embed.addFields({ name: `📂 Ticket Types (${types.length})`, value: list });
            }

            return interaction.editReply({ embeds: [embed] });
        }

        // ── الفئة الافتراضية ────────────────────────────────────────────────
        if (sub === 'فئة') {
            const cat = interaction.options.getChannel('الفئة');
            await db.setConfig('ticket_category_id', cat.id);

            const embed = new EmbedBuilder()
                .setTitle('✅ Default Ticket Category Set')
                .setColor(0xE53935)
                .setDescription(`New tickets will open inside **${cat.name}** by default.\n\nYou can override this per type using \`/إعداد-تكتات إضافة-نوع\`.`)
                .setFooter({ text: 'Ticket System • FANTASY Bot' })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        // ── لوق ─────────────────────────────────────────────────────────────
        if (sub === 'لوق') {
            const ch = interaction.options.getChannel('الروم');
            await db.setConfig('ticket_log_channel', ch.id);

            const embed = new EmbedBuilder()
                .setTitle('✅ Ticket Log Channel Set')
                .setColor(0xE53935)
                .addFields({ name: '📋 Channel', value: `<#${ch.id}>`, inline: true })
                .setFooter({ text: 'Ticket System • FANTASY Bot' })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        // ── مسؤولين ─────────────────────────────────────────────────────────
        if (sub === 'مسؤولين') {
            const role = interaction.options.getRole('الرتبة');
            await db.setConfig('ticket_admin_role', role.id);

            const embed = new EmbedBuilder()
                .setTitle('✅ Ticket Admin Role Set')
                .setColor(0xE53935)
                .setDescription(`Members with <@&${role.id}> can now **claim** and **close** tickets.`)
                .setFooter({ text: 'Ticket System • FANTASY Bot' })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }
    },
};
