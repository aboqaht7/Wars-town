const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, StringSelectMenuBuilder
} = require('discord.js');
const { resetRow, resetOption } = require('../utils');

module.exports = {
    name: 'محامي',
    data: new SlashCommandBuilder().setName('محامي').setDescription('⚖️ Certified Lawyers List'),

    async execute(message, args, db) {
        message.channel.send(await buildMain(db));
    },

    async slashExecute(interaction, db) {
        const main = await buildMain(db);
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.reply({ content: '\u200b', flags: 64 });
    },
};

module.exports.buildDashboard  = buildDashboard;
module.exports.buildMain       = buildMain;

async function buildMain(db) {
    const lawyers = await db.getLawyers();
    const img     = await db.getImage('محاماة');

    const embed = new EmbedBuilder()
        .setTitle('Certified Lawyers')
        .setColor(0x0D47A1)
        .setFooter({ text: 'Law System • FANTASY Bot' })
        .setTimestamp();

    if (img) embed.setThumbnail(img);

    if (!lawyers.length) {
        embed.setDescription('> 📭 No lawyers registered currently');
        return { embeds: [embed], components: [resetRow('محامي')] };
    }

    embed.setDescription(
        lawyers.map((l, i) => `**${i + 1}.** ${l.lawyer_name} — <@${l.discord_id}>`).join('\n')
    );

    const menu = new StringSelectMenuBuilder()
        .setCustomId('lawyer_select')
        .setPlaceholder('👤 Choose a lawyer to view their dashboard')
        .addOptions([
            ...lawyers.slice(0, 24).map(l => ({
                label: l.lawyer_name,
                value: l.discord_id,
                description: `View retainer requests for ${l.lawyer_name}`,
                emoji: '⚖️',
            })),
            resetOption('محامي'),
        ]);

    return {
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(menu)],
    };
}

async function buildDashboard(db, lawyerId, lawyerName) {
    const requests = await db.getLawyerRequests(lawyerId);
    const img      = await db.getImage('محاماة');

    const embed = new EmbedBuilder()
        .setTitle('Lawyer Dashboard')
        .setColor(0x1B5E20)
        .setAuthor({ name: `Lawyer: ${lawyerName}` })
        .setFooter({ text: 'Law System • FANTASY Bot' })
        .setTimestamp();

    if (img) embed.setThumbnail(img);

    const components = [];

    if (!requests.length) {
        embed.setDescription('> 📭 No pending retainer requests currently');
    } else {
        embed.setDescription(`> 📬 You have **${requests.length}** pending retainer request(s)`);
        embed.addFields(
            requests.slice(0, 8).map(r => ({
                name: `📁 ${r.case_number} — ${r.case_title}`,
                value: `👤 Client: **${r.plaintiff_name}** (<@${r.plaintiff_id}>)`,
                inline: false,
            }))
        );
        for (const r of requests.slice(0, 4)) {
            components.push(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`lawyer_req_accept_${r.id}`)
                        .setLabel(`Accept ${r.case_number}`).setEmoji('✅')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`lawyer_req_reject_${r.id}`)
                        .setLabel(`Reject ${r.case_number}`).setEmoji('❌')
                        .setStyle(ButtonStyle.Danger),
                )
            );
        }
    }

    components.push(resetRow('محامي'));
    return { embeds: [embed], components };
}
