const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, StringSelectMenuBuilder
} = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'identity',
    data: new SlashCommandBuilder()
        .setName('identity')
        .setDescription('نظام الهوية'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const { embed, menu } = await buildMain(message.author.id, db);
        message.channel.send({ embeds: [embed], components: [menu, resetRow('identity')] });
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const { embed, menu } = await buildMain(interaction.user.id, db);
        interaction.reply({ embeds: [embed], components: [menu, resetRow('identity')] });
    }
};

const SLOT_NAMES = { 1: 'الشخصية الأولى', 2: 'الشخصية الثانية', 3: 'الشخصية الثالثة' };

async function buildMain(userId, db) {
    const status = await db.getLoginStatus(userId);
    const identities = await db.getUserIdentities(userId);
    const activeChar = status.is_logged_in && status.active_slot
        ? identities.find(i => i.slot === status.active_slot)
        : null;

    const embed = new EmbedBuilder()
        .setTitle('🪪 نظام الهوية')
        .setColor(0x4A148C)
        .setImage(await db.getImage('identity') || null)
        .setFooter({ text: 'نظام الهوية • بوت FANTASY' })
        .setTimestamp();

    if (activeChar) {
        embed.setDescription(`✅ **مسجّل دخول** — ${SLOT_NAMES[activeChar.slot]}`)
            .addFields(
                { name: '👤 الاسم', value: `${activeChar.character_name || '—'} ${activeChar.family_name || ''}`, inline: true },
                { name: '⚧ الجنس', value: activeChar.gender || '—', inline: true },
                { name: '📅 تاريخ الميلاد', value: activeChar.birth_date || '—', inline: true },
                { name: '📍 مكان الولادة', value: activeChar.birth_place || '—', inline: true },
                { name: '🏦 الإيبان', value: `\`${activeChar.iban}\``, inline: true },
                { name: '💰 الرصيد', value: `\`${Number(activeChar.balance).toLocaleString()} ريال\``, inline: true },
            );
    } else {
        embed.setDescription('❌ **غير مسجّل دخول**\nاختر خياراً من القائمة أدناه');
        const created = identities.filter(i => i.character_name);
        if (created.length) {
            embed.addFields({
                name: '📋 شخصياتك',
                value: created.map(i => `• **${SLOT_NAMES[i.slot]}:** ${i.character_name} ${i.family_name || ''}`).join('\n'),
                inline: false,
            });
        } else {
            embed.addFields({ name: '📋 شخصياتك', value: 'لا توجد شخصيات بعد — اختر **إنشاء هوية** للبدء', inline: false });
        }
    }

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('identity_menu')
            .setPlaceholder('اختر خيار')
            .addOptions([
                { label: '✏️ إنشاء هوية', value: 'create_identity', description: 'أنشئ شخصية جديدة في إحدى الخانات الفارغة' },
                { label: '✅ تسجيل دخول', value: 'login_identity', description: 'سجّل دخول بشخصية موجودة' },
                { label: '🚪 تسجيل خروج', value: 'logout_identity', description: 'سجّل خروج من الشخصية الحالية' },
            ])
    );
    return { embed, menu };
}

module.exports.buildMain = buildMain;
