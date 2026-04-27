const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    ButtonBuilder, ButtonStyle,
} = require('discord.js');

const PAGE_SIZE = 25;

const STATUS_LABEL = {
    pending:    '⏳ Pending',
    accepted:   '✅ Accepted',
    rejected:   '❌ Rejected',
    in_progress:'🔄 In Progress',
    closed:     '🔒 Closed',
};

function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    return `${dt.getDate().toString().padStart(2,'0')}/${(dt.getMonth()+1).toString().padStart(2,'0')}/${dt.getFullYear()}`;
}

async function buildCitizenList(db, page = 0) {
    const all = await db.getAllActiveIdentities();
    const total = all.length;
    const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
    page = Math.max(0, Math.min(page, totalPages - 1));
    const slice = all.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const img = await db.getImage('citizen_file').catch(() => null);

    const embed = new EmbedBuilder()
        .setTitle('Citizen Files — CIA Intelligence')
        .setColor(0x0D1B2A)
        .setDescription(
            `🔍 Choose a citizen from the list to view their criminal and legal file.\n` +
            `> Total active citizens: **${total}**`
        )
        .setFooter({ text: `Page ${page + 1} of ${totalPages} • CIA Intelligence System` })
        .setTimestamp();
    if (img) embed.setImage(img);

    if (!slice.length) {
        embed.setDescription('> No citizens registered in the system currently.');
        return { embeds: [embed], components: [] };
    }

    const options = slice.map(i => {
        const name = [i.character_name, i.family_name].filter(Boolean).join(' ');
        const desc = [i.gender, i.birth_place].filter(Boolean).join(' • ') || 'No data';
        return new StringSelectMenuOptionBuilder()
            .setLabel(name.slice(0, 100))
            .setDescription(desc.slice(0, 100))
            .setValue(`${i.discord_id}:${i.slot}`);
    });

    const components = [
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`citizen_file_select:${page}`)
                .setPlaceholder('🔍 Choose a citizen to view their file')
                .addOptions(options)
        ),
    ];

    if (totalPages > 1) {
        components.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`citizen_file_prev:${page}`)
                    .setLabel('Previous')
                    .setEmoji('◀️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId(`citizen_file_next:${page}`)
                    .setLabel('Next')
                    .setEmoji('▶️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page >= totalPages - 1)
            )
        );
    }

    return { embeds: [embed], components };
}

async function buildCitizenEmbed(db, discordId, slot) {
    const data = await db.getCitizenData(discordId, slot);
    if (!data) return null;

    const { identity, cases, violations } = data;
    const fullName = [identity.character_name, identity.family_name].filter(Boolean).join(' ');
    const img = await db.getImage('citizen_file').catch(() => null);

    let desc = '';

    desc += '👤 **Personal Information**\n';
    desc += `> Full Name: **${fullName}**\n`;
    desc += `> Gender: ${identity.gender || '—'}\n`;
    desc += `> Birth Place: ${identity.birth_place || '—'}\n`;
    desc += `> Birth Date: ${identity.birth_date ? fmtDate(identity.birth_date) : '—'}\n`;
    desc += `> IBAN: \`${identity.iban || '—'}\`\n\n`;

    desc += '💰 **Balance**\n';
    desc += `> Bank: **${Number(identity.balance || 0).toLocaleString()} Riyals**\n`;
    desc += `> Cash: **${Number(identity.cash || 0).toLocaleString()} Riyals**\n\n`;

    desc += `⚖️ **Cases as Defendant (${cases.length})**\n`;
    if (!cases.length) {
        desc += '> No cases on record\n';
    } else {
        for (const c of cases) {
            const st = STATUS_LABEL[c.status] || c.status;
            desc += `> \`${c.case_number}\` — ${c.title} — ${st}\n`;
        }
    }
    desc += '\n';

    desc += `🚨 **Criminal Record (${violations.length})**\n`;
    if (!violations.length) {
        desc += '> No criminal record\n';
    } else {
        for (const v of violations) {
            desc += `> ${v.reason} | ${fmtDate(v.created_at)}\n`;
        }
    }

    const embed = new EmbedBuilder()
        .setTitle(`🗂️ Citizen File — ${fullName}`)
        .setColor(0x0D1B2A)
        .setDescription(desc)
        .setFooter({ text: 'CIA Intelligence System • FANTASY Bot' })
        .setTimestamp();
    if (img) embed.setImage(img);

    return embed;
}

module.exports = {
    name: 'citizen-file',
    data: new SlashCommandBuilder()
        .setName('citizen-file')
        .setDescription('View full citizen files — CIA Chef only'),

    buildCitizenList,
    buildCitizenEmbed,

    async slashExecute(interaction, db) {
        const chefRoleId = await db.getConfig('cia_chef_role');
        if (!chefRoleId || !interaction.member.roles.cache.has(chefRoleId)) {
            return interaction.reply({ content: '❌ This command is for **CIA Chef** only.', flags: 64 });
        }

        await interaction.deferReply();
        const payload = await buildCitizenList(db, 0);
        await interaction.editReply(payload);
    },
};
