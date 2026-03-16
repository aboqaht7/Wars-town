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
        const main = { embeds: [embed], components: [menu, resetRow('identity')] };
        if (interaction._isReset) return interaction.message.edit(main);
        await interaction.channel.send(main);
        await interaction.reply({ content: '​', flags: 64 });
    }
};

const SLOT_NAMES = { 1: 'الشخصية الأولى', 2: 'الشخصية الثانية', 3: 'الشخصية الثالثة' };

async function buildMain(userId, db) {
    const img = await db.getImage('identity');
    const embed = new EmbedBuilder()
        .setTitle('🪪 نظام الهوية')
        .setColor(0x4A148C)
        .setDescription('أنشئ هويتك وسجّل دخولك لبدء رحلتك في عالم FANTASY.')
        .setFooter({ text: 'نظام الهوية • بوت FANTASY' })
        .setTimestamp();
    if (img) embed.setImage(img);

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
