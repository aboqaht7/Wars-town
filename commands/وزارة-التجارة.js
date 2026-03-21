const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

const MIN_BALANCE = 50000;

module.exports = {
    name: 'وزارة-التجارة',
    data: new SlashCommandBuilder()
        .setName('وزارة-التجارة')
        .setDescription('إدارة التصاريح التجارية')
        .addSubcommand(s => s
            .setName('منح')
            .setDescription('منح تصريح تجاري للاعب')
            .addUserOption(o => o.setName('اللاعب').setDescription('اللاعب المراد منحه التصريح').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('سحب')
            .setDescription('سحب التصريح التجاري من لاعب')
            .addUserOption(o => o.setName('اللاعب').setDescription('اللاعب المراد سحب تصريحه').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('قائمة')
            .setDescription('عرض قائمة جميع حاملي التصاريح')
        ),

    async slashExecute(interaction, db) {
        const ministryRoleId = await db.getConfig('trade_ministry_role');
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        const hasMinistryRole = ministryRoleId && interaction.member.roles.cache.has(ministryRoleId);

        if (!isAdmin && !hasMinistryRole)
            return interaction.reply({ content: '❌ هذا الأمر لمسؤولي وزارة التجارة فقط.', flags: 64 });

        const sub = interaction.options.getSubcommand();

        if (sub === 'منح') {
            const target = interaction.options.getUser('اللاعب');
            const identity = await db.getActiveIdentity(target.id);
            if (!identity)
                return interaction.reply({ content: `❌ اللاعب **${target.username}** غير مسجّل دخول أو ليس لديه هوية نشطة.`, flags: 64 });

            if (identity.balance < MIN_BALANCE)
                return interaction.reply({
                    content: `❌ رصيد اللاعب في البنك **${(identity.balance || 0).toLocaleString()} ريال** — الحد الأدنى المطلوب لمنح التصريح هو **${MIN_BALANCE.toLocaleString()} ريال**.`,
                    flags: 64
                });

            await db.grantTradePermit(target.id, interaction.user.id);

            const embed = new EmbedBuilder()
                .setTitle('📄 تم منح التصريح التجاري')
                .setColor(0x1B5E20)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: '👤 اللاعب', value: `<@${target.id}>`, inline: true },
                    { name: '🏷️ الاسم', value: identity.character_name || target.username, inline: true },
                    { name: '💰 الرصيد', value: `\`${(identity.balance || 0).toLocaleString()} ريال\``, inline: true },
                    { name: '🏛️ مُنح بواسطة', value: `<@${interaction.user.id}>`, inline: true },
                )
                .setDescription('يمكن لهذا اللاعب الآن تأسيس شركة عبر الأمر `/شركة تأسيس`.')
                .setFooter({ text: 'وزارة التجارة • بوت FANTASY' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'سحب') {
            const target = interaction.options.getUser('اللاعب');
            const had = await db.revokeTradePermit(target.id);
            if (!had)
                return interaction.reply({ content: `❌ اللاعب <@${target.id}> لا يملك تصريحاً أصلاً.`, flags: 64 });

            const embed = new EmbedBuilder()
                .setTitle('🚫 تم سحب التصريح التجاري')
                .setColor(0xB71C1C)
                .addFields(
                    { name: '👤 اللاعب', value: `<@${target.id}>`, inline: true },
                    { name: '🏛️ سُحب بواسطة', value: `<@${interaction.user.id}>`, inline: true },
                )
                .setFooter({ text: 'وزارة التجارة • بوت FANTASY' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'قائمة') {
            const permits = await db.getAllTradePermits();
            if (!permits.length)
                return interaction.reply({ content: '📋 لا يوجد أي تصاريح ممنوحة حالياً.', flags: 64 });

            const list = permits.map((p, i) =>
                `**${i + 1}.** <@${p.discord_id}> — مُنح بواسطة <@${p.granted_by}>`
            ).join('\n');

            const embed = new EmbedBuilder()
                .setTitle('📋 قائمة التصاريح التجارية')
                .setColor(0x1565C0)
                .setDescription(list)
                .setFooter({ text: `وزارة التجارة • ${permits.length} تصريح` })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: 64 });
        }
    },
};
