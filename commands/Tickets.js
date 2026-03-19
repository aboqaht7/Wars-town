const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder
} = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'tickets',
    data: new SlashCommandBuilder()
        .setName('tickets')
        .setDescription('نظام التكتات'),

    async execute(message, args, db) {
        const mode    = (await db.getConfig('ticket_display_mode')) || 'buttons';
        const payloads = await build(db, mode);
        for (const p of payloads) await message.channel.send(p);
    },

    async slashExecute(interaction, db) {
        if (interaction._isReset) {
            const mode    = (await db.getConfig('ticket_display_mode')) || 'buttons';
            const payloads = await build(db, mode);
            return interaction.message.edit(payloads[0]);
        }
        await interaction.deferReply({ flags: 64 });
        const mode    = (await db.getConfig('ticket_display_mode')) || 'buttons';
        const payloads = await build(db, mode);
        for (const p of payloads) await interaction.channel.send(p);
        await interaction.deleteReply().catch(() => {});
    }
};

async function build(db, mode) {
    const types = await db.getTicketTypes();
    const img   = await db.getImage('tickets').catch(() => null);

    if (!types.length) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 نظام التكتات')
            .setColor(0x1565C0)
            .setDescription('> لا توجد أنواع تكتات متاحة حالياً. انتظر الإدارة.')
            .setFooter({ text: 'نظام التكتات • بوت FANTASY' }).setTimestamp();
        if (img) embed.setImage(img);
        return [{ embeds: [embed], components: [resetRow('tickets')] }];
    }

    if (mode === 'menu') {
        return buildMenu(types, img);
    }
    return buildEmbeds(types, img);
}

function buildMenu(types, img) {
    const embed = new EmbedBuilder()
        .setTitle('🎫 نظام التكتات')
        .setColor(0x1565C0)
        .setDescription('اختر نوع التكت من القائمة أدناه وسيُنشأ لك روم خاص.')
        .setFooter({ text: 'نظام التكتات • بوت FANTASY' }).setTimestamp();
    if (img) embed.setImage(img);

    const options = types.slice(0, 25).map(t => ({
        label: `${t.emoji} ${t.name}`,
        value: String(t.id),
        description: t.role_id ? `يستلمه فريق مخصص` : 'انقر للفتح',
    }));

    const menuRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('tickets_type_menu')
            .setPlaceholder('🎫 اختر نوع التكت')
            .addOptions(options)
    );

    return [{ embeds: [embed], components: [menuRow, resetRow('tickets')] }];
}

function buildEmbeds(types, img) {
    const payloads = [];

    for (let i = 0; i < types.length; i++) {
        const t = types[i];
        const isLast = i === types.length - 1;

        const embed = new EmbedBuilder()
            .setTitle(`${t.emoji} ${t.name}`)
            .setColor(0x1565C0)
            .setDescription(
                t.role_id
                    ? `اضغط الزر لفتح تكت **${t.name}**.\n🛡️ يستلمه: <@&${t.role_id}>`
                    : `اضغط الزر لفتح تكت **${t.name}**.`
            )
            .setFooter({ text: 'نظام التكتات • بوت FANTASY' });

        if (img && i === 0) embed.setImage(img);

        const btnRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`open_ticket_${t.id}`)
                .setLabel('🎫 فتح التكت')
                .setStyle(ButtonStyle.Primary)
        );

        const components = isLast ? [btnRow, resetRow('tickets')] : [btnRow];
        payloads.push({ embeds: [embed], components });
    }

    return payloads;
}
