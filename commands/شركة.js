const {
    SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits,
    ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder
} = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'شركة',
    data: new SlashCommandBuilder()
        .setName('شركة')
        .setDescription('إدارة شركتك')
        .addSubcommand(s => s
            .setName('تأسيس')
            .setDescription('تأسيس شركة جديدة (يتطلب تصريح تجاري)')
        )
        .addSubcommand(s => s
            .setName('معلومات')
            .setDescription('عرض معلومات شركتك')
        )
        .addSubcommand(s => s
            .setName('تعيين')
            .setDescription('تعيين موظف في الشركة (مالك فقط)')
            .addUserOption(o => o.setName('اللاعب').setDescription('اللاعب المراد تعيينه').setRequired(true))
            .addStringOption(o => o
                .setName('الرتبة')
                .setDescription('رتبة الموظف')
                .setRequired(true)
                .addChoices(
                    { name: 'مدير', value: 'مدير' },
                    { name: 'محاسب', value: 'محاسب' },
                    { name: 'موظف', value: 'موظف' },
                )
            )
        )
        .addSubcommand(s => s
            .setName('إقالة')
            .setDescription('إقالة موظف من الشركة (مالك فقط)')
            .addUserOption(o => o.setName('اللاعب').setDescription('اللاعب المراد إقالته').setRequired(true))
        )
        .addSubcommand(s => s
            .setName('إيداع')
            .setDescription('إيداع مبلغ من كاشك لحساب الشركة')
            .addIntegerOption(o => o.setName('المبلغ').setDescription('المبلغ المراد إيداعه').setRequired(true).setMinValue(1))
        )
        .addSubcommand(s => s
            .setName('سحب')
            .setDescription('سحب مبلغ من حساب الشركة (مالك أو مدير)')
            .addIntegerOption(o => o.setName('المبلغ').setDescription('المبلغ المراد سحبه').setRequired(true).setMinValue(1))
        )
        .addSubcommand(s => s
            .setName('حل')
            .setDescription('حل الشركة وإغلاقها نهائياً (مالك فقط)')
        )
        .addSubcommand(s => s
            .setName('قائمة')
            .setDescription('عرض قائمة جميع الشركات المسجلة')
        ),

    async slashExecute(interaction, db) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'تأسيس') {
            const identity = await db.getActiveIdentity(interaction.user.id);
            if (!identity)
                return interaction.reply({ content: 'ماسجلت دخولك؟سجل دخولك يالامير بعدين تعال', flags: 64 });

            const hasPerm = await db.hasTradePermit(interaction.user.id);
            if (!hasPerm)
                return interaction.reply({ content: '❌ لا تملك تصريحاً تجارياً. تواصل مع **وزارة التجارة** للحصول على تصريح.', flags: 64 });

            const existingComp = await db.getUserCompany(interaction.user.id);
            if (existingComp)
                return interaction.reply({ content: `❌ أنت مرتبط بالفعل بشركة **${existingComp.name}**. لا يمكنك تأسيس شركة أخرى.`, flags: 64 });

            const modal = new ModalBuilder()
                .setCustomId('company_found_modal')
                .setTitle('📋 استبيان تأسيس الشركة');

            const personalInfo = new TextInputBuilder()
                .setCustomId('cf_personal')
                .setLabel('المعلومات الشخصية')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('1. اسمك داخل الرول:\n2. عمرك داخل الرول:\n3. عمرك الحقيقي:')
                .setRequired(true)
                .setMaxLength(300);

            const companyName = new TextInputBuilder()
                .setCustomId('cf_name')
                .setLabel('اسم الشركة')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('اكتب اسم الشركة هنا')
                .setRequired(true)
                .setMaxLength(40);

            const companyDetails = new TextInputBuilder()
                .setCustomId('cf_details')
                .setLabel('تفاصيل الشركة')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('5. نوع الشركة (مطعم - شركة أمن - ورشة - استيراد وتصدير):\n6. فكرة الشركة بالتفصيل:\n7. موقع الشركة داخل المدينة:')
                .setRequired(true)
                .setMaxLength(800);

            const managementPlan = new TextInputBuilder()
                .setCustomId('cf_management')
                .setLabel('خطة الإدارة والتوظيف')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('8. كيف راح تدير الشركة؟\n9. هل عندك خبرة سابقة؟\n10. كم عدد الموظفين المتوقع؟\n11. كيف راح توظف اللاعبين؟')
                .setRequired(true)
                .setMaxLength(800);

            const financialCommitment = new TextInputBuilder()
                .setCustomId('cf_financial')
                .setLabel('الجانب المالي والالتزام')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('12. رأس المال المتوقع:\n13. مصدر الأموال داخل RP:\n14. خطتك للربح والاستمرارية:\n15. هل تتعهد بالالتزام بالقوانين؟\n16. هل تقبل إغلاق الشركة عند المخالفة؟')
                .setRequired(true)
                .setMaxLength(800);

            modal.addComponents(
                new ActionRowBuilder().addComponents(personalInfo),
                new ActionRowBuilder().addComponents(companyName),
                new ActionRowBuilder().addComponents(companyDetails),
                new ActionRowBuilder().addComponents(managementPlan),
                new ActionRowBuilder().addComponents(financialCommitment),
            );

            return interaction.showModal(modal);
        }

        if (sub === 'معلومات') {
            const company = await db.getUserCompany(interaction.user.id);
            if (!company)
                return interaction.reply({ content: '❌ أنت لست مرتبطاً بأي شركة.', flags: 64 });

            const members = await db.getCompanyMembers(company.id);
            const memberList = members.length
                ? members.map(m => `<@${m.discord_id}> — **${m.role}**`).join('\n')
                : '_لا يوجد موظفون_';

            const embed = new EmbedBuilder()
                .setTitle(`🏢 ${company.name}`)
                .setColor(0x1565C0)
                .addFields(
                    { name: '👑 المالك', value: `<@${company.owner_discord_id}>`, inline: true },
                    { name: '💰 رصيد الشركة', value: `\`${(company.balance || 0).toLocaleString()} ريال\``, inline: true },
                    { name: '🏷️ رتبتك', value: `**${company.userRole}**`, inline: true },
                    { name: `👥 الموظفون (${members.length})`, value: memberList, inline: false },
                )
                .setFooter({ text: 'نظام الشركات • بوت FANTASY' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        if (sub === 'تعيين') {
            const company = await db.getCompanyByOwner(interaction.user.id);
            if (!company)
                return interaction.reply({ content: '❌ أنت لست مالك أي شركة.', flags: 64 });

            const target = interaction.options.getUser('اللاعب');
            const role = interaction.options.getString('الرتبة');

            if (target.id === interaction.user.id)
                return interaction.reply({ content: '❌ لا يمكنك تعيين نفسك.', flags: 64 });

            const existing = (await db.getCompanyMembers(company.id)).find(m => m.discord_id === target.id);
            if (existing) {
                await db.updateCompanyMemberRole(company.id, target.id, role);
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('✏️ تم تحديث رتبة الموظف')
                        .setColor(0xF57F17)
                        .addFields(
                            { name: '👤 الموظف', value: `<@${target.id}>`, inline: true },
                            { name: '🏷️ الرتبة الجديدة', value: `**${role}**`, inline: true },
                        )
                        .setFooter({ text: `${company.name} • بوت FANTASY` }).setTimestamp()],
                    flags: 64
                });
            }

            const res = await db.addCompanyMember(company.id, target.id, role);
            if (res.error)
                return interaction.reply({ content: `❌ ${res.error}`, flags: 64 });

            const embed = new EmbedBuilder()
                .setTitle('✅ تم تعيين الموظف')
                .setColor(0x1B5E20)
                .addFields(
                    { name: '👤 الموظف', value: `<@${target.id}>`, inline: true },
                    { name: '🏷️ الرتبة', value: `**${role}**`, inline: true },
                    { name: '🏢 الشركة', value: company.name, inline: true },
                )
                .setFooter({ text: 'نظام الشركات • بوت FANTASY' }).setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'إقالة') {
            const company = await db.getCompanyByOwner(interaction.user.id);
            if (!company)
                return interaction.reply({ content: '❌ أنت لست مالك أي شركة.', flags: 64 });

            const target = interaction.options.getUser('اللاعب');
            if (target.id === interaction.user.id)
                return interaction.reply({ content: '❌ لا يمكنك إقالة نفسك.', flags: 64 });

            const removed = await db.removeCompanyMember(company.id, target.id);
            if (!removed)
                return interaction.reply({ content: '❌ هذا اللاعب ليس موظفاً في شركتك.', flags: 64 });

            const embed = new EmbedBuilder()
                .setTitle('🚫 تم الإقالة')
                .setColor(0xB71C1C)
                .addFields(
                    { name: '👤 الموظف', value: `<@${target.id}>`, inline: true },
                    { name: '🏢 الشركة', value: company.name, inline: true },
                )
                .setFooter({ text: 'نظام الشركات • بوت FANTASY' }).setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'إيداع') {
            const identity = await db.getActiveIdentity(interaction.user.id);
            if (!identity)
                return interaction.reply({ content: 'ماسجلت دخولك؟سجل دخولك يالامير بعدين تعال', flags: 64 });

            const company = await db.getUserCompany(interaction.user.id);
            if (!company)
                return interaction.reply({ content: '❌ أنت لست مرتبطاً بأي شركة.', flags: 64 });

            const amount = interaction.options.getInteger('المبلغ');
            const result = await db.depositToCompany(company.id, interaction.user.id, identity.slot, amount);
            if (result.error)
                return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });

            const updated = await db.getCompanyById(company.id);
            const embed = new EmbedBuilder()
                .setTitle('📥 تم الإيداع في حساب الشركة')
                .setColor(0x1B5E20)
                .addFields(
                    { name: '🏢 الشركة', value: company.name, inline: true },
                    { name: '💵 المبلغ المودَع', value: `\`${amount.toLocaleString()} ريال\``, inline: true },
                    { name: '💰 رصيد الشركة الآن', value: `\`${(updated?.balance || 0).toLocaleString()} ريال\``, inline: true },
                )
                .setFooter({ text: 'نظام الشركات • بوت FANTASY' }).setTimestamp();

            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        if (sub === 'سحب') {
            const identity = await db.getActiveIdentity(interaction.user.id);
            if (!identity)
                return interaction.reply({ content: 'ماسجلت دخولك؟سجل دخولك يالامير بعدين تعال', flags: 64 });

            const company = await db.getUserCompany(interaction.user.id);
            if (!company)
                return interaction.reply({ content: '❌ أنت لست مرتبطاً بأي شركة.', flags: 64 });

            if (company.userRole !== 'مالك' && company.userRole !== 'مدير')
                return interaction.reply({ content: '❌ فقط المالك والمدير يستطيعان سحب الأموال.', flags: 64 });

            const amount = interaction.options.getInteger('المبلغ');
            const result = await db.withdrawFromCompany(company.id, interaction.user.id, identity.slot, amount);
            if (result.error)
                return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });

            const updated = await db.getCompanyById(company.id);
            const embed = new EmbedBuilder()
                .setTitle('💸 تم السحب من حساب الشركة')
                .setColor(0xF57F17)
                .addFields(
                    { name: '🏢 الشركة', value: company.name, inline: true },
                    { name: '💵 المبلغ المسحوب', value: `\`${amount.toLocaleString()} ريال\``, inline: true },
                    { name: '💰 رصيد الشركة الآن', value: `\`${(updated?.balance || 0).toLocaleString()} ريال\``, inline: true },
                )
                .setFooter({ text: 'نظام الشركات • بوت FANTASY' }).setTimestamp();

            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        if (sub === 'حل') {
            const company = await db.getCompanyByOwner(interaction.user.id);
            if (!company)
                return interaction.reply({ content: '❌ أنت لست مالك أي شركة.', flags: 64 });

            if (company.balance > 0)
                return interaction.reply({ content: `❌ لا يمكن حل الشركة ورصيدها **${company.balance.toLocaleString()} ريال**. اسحب الرصيد أولاً.`, flags: 64 });

            await db.dissolveCompany(company.id);

            const embed = new EmbedBuilder()
                .setTitle('🏚️ تم حل الشركة')
                .setColor(0xB71C1C)
                .setDescription(`تم حل شركة **${company.name}** نهائياً وإغلاق جميع سجلاتها.`)
                .setFooter({ text: 'نظام الشركات • بوت FANTASY' }).setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'قائمة') {
            const companies = await db.getAllCompanies();
            if (!companies.length)
                return interaction.reply({ content: '📋 لا توجد شركات مسجلة حالياً.', flags: 64 });

            const list = companies.map((c, i) =>
                `**${i + 1}.** 🏢 **${c.name}** — مالك: <@${c.owner_discord_id}> — رصيد: \`${(c.balance || 0).toLocaleString()} ريال\``
            ).join('\n');

            const embed = new EmbedBuilder()
                .setTitle('🏢 قائمة الشركات المسجلة')
                .setColor(0x1565C0)
                .setDescription(list)
                .setFooter({ text: `نظام الشركات • ${companies.length} شركة` })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: 64 });
        }
    },
};
