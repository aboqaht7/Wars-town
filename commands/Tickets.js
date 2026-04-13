const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');
const { resetRow } = require('../utils');
const { parseEmoji } = require('../btnConfig');

module.exports = {
    name: 'tickets',
    data: new SlashCommandBuilder()
        .setName('tickets')
        .setDescription('نظام التكتات'),

    async execute(message, args, db) {
        const payload = await build(db);
        await message.channel.send(payload);
    },

    async slashExecute(interaction, db) {
        if (interaction._isReset) {
            const payload = await build(db);
            return interaction.message.edit(payload);
        }
        await interaction.deferReply({ flags: 64 });
        const payload = await build(db);
        await interaction.channel.send(payload);
        await interaction.deleteReply().catch(() => {});
    }
};

async function build(db) {
    const types = await db.getTicketTypes();
    const img   = await db.getImage('tickets').catch(() => null);

    const embed = new EmbedBuilder()
        .setTitle('🎫 نظام التكتات')
        .setColor(0x1565C0)
        .setFooter({ text: 'نظام التكتات • بوت FANTASY' })
        .setTimestamp();
    if (img) embed.setImage(img);

    if (!types.length) {
        embed.setDescription('> لا توجد أنواع تكتات متاحة حالياً. انتظر الإدارة.');
        return { embeds: [embed], components: [resetRow('tickets')] };
    }

    embed.setDescription('اختر نوع التكت من القائمة أدناه وسيُنشأ لك روم خاص.');

    const options = types.slice(0, 25).map(t => {
        const opt = new StringSelectMenuOptionBuilder()
            .setLabel(t.name || 'تكت')
            .setValue(String(t.id))
            .setDescription(t.role_id ? 'يستلمه فريق مخصص' : 'انقر للفتح');
        if (t.emoji) {
            const parsed = parseEmoji(t.emoji);
            console.log(`[TICKET EMOJI] id=${t.id} raw="${t.emoji}" parsed=${JSON.stringify(parsed)}`);
            if (parsed) {
                try {
                    const emojiArg = typeof parsed === 'string' ? { name: parsed } : parsed;
                    opt.setEmoji(emojiArg);
                    console.log(`[TICKET EMOJI] ✅ setEmoji(${JSON.stringify(emojiArg)}) for "${t.name}"`);
                } catch (e) {
                    console.error(`[TICKET EMOJI] ❌ setEmoji failed for "${t.name}": ${e.message}`);
                }
            }
        }
        return opt;
    });

    const menuRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('tickets_type_menu')
            .setPlaceholder('🎫 اختر نوع التكت')
            .addOptions(options)
    );

    return { embeds: [embed], components: [menuRow, resetRow('tickets')] };
}
