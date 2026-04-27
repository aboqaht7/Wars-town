const {
    SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits,
    ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');

const ACTION_LABELS = {
    login:            '✅ Login',
    logout:           '🚪 Logout',
    hurricane_logout: '🌪️ Auto Logout (Hurricane)',
    trip_logout:      '✈️ Logout (Trip Closed)',
    approved:         '🟢 Identity Approved',
    rejected:         '🔴 Identity Rejected',
    pending:          '⏳ New Identity Request',
};

const SLOT_NAMES = { 1: 'Character 1', 2: 'Character 2', 3: 'Character 3' };

module.exports = {
    name: 'character-log',
    data: new SlashCommandBuilder()
        .setName('character-log')
        .setDescription('Character event log and pending identity requests')
        .addIntegerOption(opt =>
            opt.setName('عدد').setDescription('Number of log entries (default 15)').setRequired(false).setMinValue(1).setMaxValue(50))
        .addUserOption(opt =>
            opt.setName('مستخدم').setDescription('Filter by a specific user').setRequired(false)),

    async slashExecute(interaction, db) {
        const limit  = interaction.options.getInteger('عدد') || 15;
        const user   = interaction.options.getUser('مستخدم');

        const [logs, pending] = await Promise.all([
            db.getCharacterLogs(limit, user?.id),
            user ? [] : db.getPendingIdentities(10),
        ]);

        const components = [];

        if (pending.length > 0) {
            const pendingEmbed = new EmbedBuilder()
                .setTitle('⏳ Pending Identity Requests')
                .setColor(0xF57F17)
                .setFooter({ text: `${pending.length} request(s) awaiting review` })
                .setTimestamp();

            for (const p of pending) {
                const time = `<t:${Math.floor(new Date(p.created_at).getTime() / 1000)}:R>`;
                pendingEmbed.addFields({
                    name: `#${p.id} — <@${p.discord_id}> — ${SLOT_NAMES[p.slot] || `Character ${p.slot}`}`,
                    value: `👤 ${p.char_name} ${p.family_name} • ⚧ ${p.gender} • 📅 ${p.birth_date} • 📍 ${p.birth_place}\n🕐 ${time}`,
                    inline: false,
                });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`approve_identity_${p.id}`)
                        .setLabel(`Approve #${p.id}`).setEmoji('✅')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`reject_identity_${p.id}`)
                        .setLabel(`Reject #${p.id}`).setEmoji('❌')
                        .setStyle(ButtonStyle.Danger)
                );
                components.push(row);
            }

            await interaction.channel.send({ embeds: [pendingEmbed], components });
            await interaction.reply({ content: '​', flags: 64 });
        }

        const logEmbed = new EmbedBuilder()
            .setTitle('Character Log')
            .setColor(0x37474F)
            .setFooter({ text: `FANTASY Bot • Last ${limit} entries` })
            .setTimestamp();

        if (!logs.length) {
            logEmbed.setDescription('> No log entries yet.');
        } else {
            const lines = logs.map(l => {
                const label    = ACTION_LABELS[l.action] || l.action;
                const time     = `<t:${Math.floor(new Date(l.created_at).getTime() / 1000)}:R>`;
                const charInfo = l.character_name ? ` — **${l.character_name}**` : '';
                const slotStr  = l.slot ? ` (${SLOT_NAMES[l.slot] || `Character ${l.slot}`})` : '';
                const who      = l.discord_id === 'system' ? '🤖 System' : `<@${l.discord_id}>`;
                return `${label} • ${who}${charInfo}${slotStr} ${time}`;
            });
            logEmbed.setDescription(lines.join('\n'));
        }

        if (pending.length > 0) {
            await interaction.followUp({ embeds: [logEmbed] });
        } else {
            await interaction.channel.send({ embeds: [logEmbed] });
            await interaction.reply({ content: '​', flags: 64 });
        }
    }
};
