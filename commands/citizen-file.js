const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    ButtonBuilder, ButtonStyle,
} = require('discord.js');

const PAGE_SIZE = 25;

const STATUS_LABEL = {
    pending:    '⏳ معلقة',
    accepted:   '✅ مقبولة',
    rejected:   '❌ مرفوضة',
    in_progress:'🔄 جارية',
    closed:     '🔒 مغلقة',
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
        .setTitle('🗂️ ملفات المواطنين — CIA Intelligence')
        .setColor(0x0D1B2A)
        .setDescription(
            `🔍 اختر مواطناً من القائمة لعرض ملفه الجنائي والقانوني.\n` +
            `> إجمالي المواطنين النشطين: **${total}**`
        )
        .setFooter({ text: `صفحة ${page + 1} من ${totalPages} • CIA Intelligence System` })
        .setTimestamp();
    if (img) embed.setImage(img);

    if (!slice.length) {
        embed.setDescription('> لا يوجد مواطنون مسجلون في النظام حالياً.');
        return { embeds: [embed], components: [] };
    }

    const options = slice.map(i => {
        const name = [i.character_name, i.family_name].filter(Boolean).join(' ');
        const desc = [i.gender, i.birth_place].filter(Boolean).join(' • ') || 'لا توجد بيانات';
        return new StringSelectMenuOptionBuilder()
            .setLabel(name.slice(0, 100))
            .setDescription(desc.slice(0, 100))
            .setValue(`${i.discord_id}:${i.slot}`);
    });

    const components = [
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`citizen_file_select:${page}`)
                .setPlaceholder('🔍 اختر مواطناً لعرض ملفه')
                .addOptions(options)
        ),
    ];

    if (totalPages > 1) {
        components.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`citizen_file_prev:${page}`)
                    .setLabel('السابق')
                    .setEmoji('◀️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId(`citizen_file_next:${page}`)
                    .setLabel('التالي')
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

    desc += '👤 **المعلومات الشخصية**\n';
    desc += `> الاسم الكامل: **${fullName}**\n`;
    desc += `> الجنس: ${identity.gender || '—'}\n`;
    desc += `> مكان الميلاد: ${identity.birth_place || '—'}\n`;
    desc += `> تاريخ الميلاد: ${identity.birth_date ? fmtDate(identity.birth_date) : '—'}\n`;
    desc += `> رقم IBAN: \`${identity.iban || '—'}\`\n\n`;

    desc += '💰 **الرصيد**\n';
    desc += `> البنكي: **${Number(identity.balance || 0).toLocaleString()} ريال**\n`;
    desc += `> الكاش: **${Number(identity.cash || 0).toLocaleString()} ريال**\n\n`;

    desc += `⚖️ **القضايا كمتهم (${cases.length})**\n`;
    if (!cases.length) {
        desc += '> لا توجد قضايا مسجلة\n';
    } else {
        for (const c of cases) {
            const st = STATUS_LABEL[c.status] || c.status;
            desc += `> \`${c.case_number}\` — ${c.title} — ${st}\n`;
        }
    }
    desc += '\n';

    desc += `🚨 **السوابق الجنائية (${violations.length})**\n`;
    if (!violations.length) {
        desc += '> لا توجد سوابق جنائية\n';
    } else {
        for (const v of violations) {
            desc += `> ${v.reason} | ${fmtDate(v.created_at)}\n`;
        }
    }

    const embed = new EmbedBuilder()
        .setTitle(`🗂️ ملف مواطن — ${fullName}`)
        .setColor(0x0D1B2A)
        .setDescription(desc)
        .setFooter({ text: 'CIA Intelligence System • بوت FANTASY' })
        .setTimestamp();
    if (img) embed.setImage(img);

    return embed;
}

module.exports = {
    name: 'citizen-file',
    data: new SlashCommandBuilder()
        .setName('citizen-file')
        .setDescription('عرض ملفات المواطنين الكاملة — CIA Chef فقط'),

    buildCitizenList,
    buildCitizenEmbed,

    async slashExecute(interaction, db) {
        const chefRoleId = await db.getConfig('cia_chef_role');
        if (!chefRoleId || !interaction.member.roles.cache.has(chefRoleId)) {
            return interaction.reply({ content: '❌ هذا الأمر مخصص لـ **CIA Chef** فقط.', flags: 64 });
        }

        const payload = await buildCitizenList(db, 0);
        await interaction.reply(payload);
    },
};
