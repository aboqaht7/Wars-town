const fs = require('fs');
const {
    Client, Collection, GatewayIntentBits, EmbedBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    ActionRowBuilder, StringSelectMenuBuilder,
    ButtonBuilder, ButtonStyle
} = require('discord.js');
const db = require('./database');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once('clientReady', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

const menuHandlers = {
    help_menu: {
        identity: '🪪 **الهوية** — اكتب `/identity` لعرض شخصيتك والإيبان الخاص بها.',
        phone: '📱 **الجوال** — اكتب `/phone` لعرض هاتفك وإدارة اتصالاتك.',
        bag: '🎒 **الحقيبة** — اكتب `/bag` لعرض أغراضك. لنقل غرض: `-نقل [غرض] @مستخدم`',
        bank: '🏦 **البنك** — اكتب `/bank` لعرض رصيدك وإيبانك. لتحويل مال: `-تحويل [إيبان] [مبلغ]`',
        police: '👮 **الشرطة** — أوامر: `-كلبشة @مستخدم` | `-تلويت @مستخدم` | `-باند @مستخدم` | `-تشهير @مستخدم`',
        events: '✈️ **الرحلات والأحداث** — اكتب `/events` لفتح رحلة أو تفعيل حدث.',
        jobs: '💼 **الوظائف** — اكتب `/jobs` لاختيار وظيفتك (صيد، تكسي، صيد حيوانات، منجم).',
        market: '🛒 **سوق الأدوات** — اكتب `/market` لشراء السنارة والفأس وأدوات المنجم.',
        law: '⚖️ **المحاماة** — اكتب `/law` لفتح قضية أو إدارة القضايا.',
        admin: '🛡️ **الإدارة** — اكتب `/admin` لعرض لوحة الإدارة.',
        crime: '🔫 **الجرائم** — اكتب `/crime` لتنفيذ جريمة.',
        tickets: '🎫 **التكتات** — اكتب `/tickets` لفتح تكت (شكوى، اقتراح، بلاغ).',
        vehicles: '🚗 **السيارات والمعرض**\n• `/سيارات` — سياراتك المسجلة\n• `/معارض` — عرض المعرض\n• `/اضافة-معرض` — إضافة سيارة للمعرض',
        sms: '💬 **الرسائل**\n• `-رسالة @مستخدم [نص]` — إرسال رسالة\n• `-صندوق` — عرض صندوق الرسائل\n• `-جهات @مستخدم [اسم]` — إضافة جهة اتصال\n• `-جهات` — عرض جهات الاتصال',
        x_platform: '𝕏 **منصة X**\n• `-تغريد [نص]` — نشر تغريدة\n• `/منصة-x` — عرض المنشورات\n• `-حذف-تغريدة [رقم]` — حذف تغريدتك',
    },
    admin_menu: {
        ranks: '🏅 **عرض الرتب** — تواصل مع الإدارة لعرض رتبتك الحالية.',
        points: '⭐ **نقاط الإدارة** — تواصل مع الإدارة لمعرفة نقاطك.',
        manage: '👥 **إدارة اللاعبين** — صلاحية خاصة بالإدارة فقط.',
        logs: '📋 **سجل الإجراءات** — سجل جميع الإجراءات الإدارية.',
    },
    police_menu: {
        handcuff: '🔗 **كلبشة** — الأمر: `-كلبشة @اللاعب`',
        wanted: '🚨 **تلويت** — الأمر: `-تلويت @اللاعب`',
        ban: '🚫 **باند** — الأمر: `-باند @اللاعب السبب`',
        defame: '📢 **تشهير** — الأمر: `-تشهير @اللاعب السبب`',
    },
    crime_menu: {
        robbery: '💰 **سرقة** — تواصل مع الإدارة لتنفيذ عملية السرقة.',
        kidnap: '🪢 **خطف** — تواصل مع الإدارة لتنفيذ عملية الخطف.',
        fraud: '🎭 **نصب واحتيال** — تواصل مع الإدارة لتنفيذ عملية الاحتيال.',
        armed_robbery: '🔫 **سطو مسلح** — تواصل مع الإدارة لتنفيذ السطو المسلح.',
    },
    events_menu: {
        open_flight: '✈️ **فتح رحلة** — تواصل مع الإدارة لفتح رحلة جديدة.',
        hurricane: '🌀 **إعصار** — تواصل مع الإدارة لتفعيل حدث الإعصار.',
        alert: '📣 **تنبيه عام** — تواصل مع الإدارة لإرسال تنبيه للجميع.',
        special_event: '🎉 **حدث خاص** — تواصل مع الإدارة لتفعيل حدث خاص.',
    },
    jobs_menu: {
        fishing: '🎣 **صيد السمك** — توجه لمنطقة الصيد وابدأ رحلة الصيد.',
        taxi: '🚕 **تكسي** — توجه لمحطة التكسي وابدأ العمل.',
        hunting: '🦌 **صيد الحيوانات** — توجه للغابة وابدأ رحلة الصيد.',
        mining: '⛏️ **منجم** — توجه للمنجم وابدأ استخراج المعادن.',
    },
    law_menu: {
        new_case: '📁 **فتح قضية** — تواصل مع الإدارة لفتح قضية جديدة.',
        view_cases: '📋 **عرض القضايا** — تواصل مع الإدارة لعرض قضاياك.',
        hire_lawyer: '👨‍⚖️ **توكيل محامٍ** — تواصل مع الإدارة لتوكيل محامٍ.',
        legal_process: '⚖️ **الإجراءات القانونية** — تواصل مع الإدارة لمعرفة الإجراءات.',
    },
    market_menu: {
        fishing_rod: '🎣 **سنارة صيد** — تواصل مع الإدارة لشراء سنارة الصيد.',
        axe: '🪓 **فأس** — تواصل مع الإدارة لشراء فأس للحطب.',
        mining_tools: '⛏️ **أدوات منجم** — تواصل مع الإدارة لشراء أدوات المنجم.',
        auction: '🔨 **مزاد** — تواصل مع الإدارة لحضور مزاد السيارات والعقارات.',
    },
    health_menu: {
        hospital_resuscitation: '🏥 **إنعاش مستشفى** — تواصل مع طاقم المستشفى لإنعاشك.',
        decay: '💀 **تحلل** — شخصيتك في وضع التحلل، تواصل مع الإدارة.',
        witch_resuscitation: '🧙 **إنعاش ساحرة** — تواصل مع الساحرة للحصول على الإنعاش.',
    },
    properties_menu: {
        villa: '🏡 **فيلا** — تواصل مع الإدارة لاستفسارات شراء الفيلا.',
        apartment: '🏢 **شقة** — تواصل مع الإدارة لاستفسارات شراء الشقة.',
        land: '🌍 **أرض** — تواصل مع الإدارة لاستفسارات شراء الأرض.',
        office: '🏬 **مكتب تجاري** — تواصل مع الإدارة لاستفسارات الشراء.',
    },
    ticket_menu: {
        complaint: '📋 **شكوى** — اكتب تفاصيل شكواك وأرسلها للإدارة.',
        suggestion: '💡 **اقتراح** — اكتب اقتراحك وسيتم مراجعته.',
        report: '🚨 **بلاغ** — اكتب تفاصيل البلاغ مع الأدلة وأرسله للإدارة.',
        inquiry: '❓ **استفسار** — اكتب استفسارك وستحصل على رد.',
    },
};

async function sendToCharLog(embed) {
    try {
        const channelId = await db.getConfig('character_log_channel');
        if (!channelId) return;
        const ch = await client.channels.fetch(channelId);
        if (ch) await ch.send({ embeds: [embed] });
    } catch (e) {
        console.error('char log channel error:', e);
    }
}

const resetCommandMap = {
    police: 'police', bank: 'bank', bag: 'bag', identity: 'identity',
    phone: 'phone', events: 'events', jobs: 'jobs', market: 'market',
    law: 'law', admin: 'admin', crime: 'crime', health: 'health',
    tickets: 'tickets', showroom: 'معارض', vehicles: 'سيارات',
    x_platform: 'منصة-x', help: 'help',
};

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('reset_')) {
            const key = interaction.customId.replace('reset_', '');
            const commandName = resetCommandMap[key];
            const command = commandName ? client.commands.get(commandName) : null;
            if (command?.slashExecute) {
                try {
                    await interaction.deferUpdate();
                    interaction.reply = (data) => interaction.editReply(data);
                    await command.slashExecute(interaction, db);
                } catch (e) {
                    console.error(e);
                    try {
                        if (interaction.deferred) interaction.editReply({ content: 'حدث خطأ.' });
                    } catch {}
                }
            }
        }

        if (interaction.customId.startsWith('approve_identity_') || interaction.customId.startsWith('reject_identity_')) {
            const isApprove = interaction.customId.startsWith('approve_identity_');
            const pendingId  = parseInt(interaction.customId.replace(isApprove ? 'approve_identity_' : 'reject_identity_', ''));
            try {
                const adminRole = await db.getConfig('identity_admin_role');
                if (adminRole && !interaction.member.roles.cache.has(adminRole)) {
                    return interaction.reply({ content: '❌ ليس لديك صلاحية على هويات اللاعبين.', flags: 64 });
                }
                const pending = await db.getPendingIdentity(pendingId);
                if (!pending) return interaction.reply({ content: '❌ الطلب غير موجود أو تمت معالجته بالفعل.', flags: 64 });

                if (isApprove) {
                    const char = await db.createIdentityFull(pending.discord_id, pending.slot, {
                        charName: pending.char_name, familyName: pending.family_name,
                        birthPlace: pending.birth_place, birthDate: pending.birth_date, gender: pending.gender
                    });
                    await db.updatePendingStatus(pendingId, 'approved');
                    await db.addCharacterLog(pending.discord_id, pending.username, 'approved', pending.char_name, pending.slot, `قبله: ${interaction.user.username}`);

                    const resultEmbed = new EmbedBuilder()
                        .setTitle('✅ تم قبول طلب الهوية')
                        .setColor(0x2E7D32)
                        .addFields(
                            { name: '👤 المستخدم', value: `<@${pending.discord_id}>`, inline: true },
                            { name: '📋 الشخصية', value: `شخصية ${pending.slot}: **${pending.char_name} ${pending.family_name}**`, inline: true },
                            { name: '✅ قبله', value: `<@${interaction.user.id}>`, inline: true },
                            { name: '🏦 الإيبان', value: `\`${char.iban}\``, inline: true },
                        )
                        .setFooter({ text: 'نظام الهوية • بوت FANTASY' }).setTimestamp();
                    sendToCharLog(resultEmbed);
                    await interaction.update({ embeds: [resultEmbed], components: [] });

                    try {
                        const user = await client.users.fetch(pending.discord_id);
                        const slotNamesApprove = { 1: 'الشخصية الأولى', 2: 'الشخصية الثانية', 3: 'الشخصية الثالثة' };
                        const approveDmEmbed = new EmbedBuilder()
                            .setTitle('✅ تم قبول طلب هويتك!')
                            .setColor(0x2E7D32)
                            .setDescription('مبروك! تم قبول هويتك بنجاح. يمكنك الآن تسجيل الدخول.')
                            .addFields(
                                { name: '📌 الشخصية', value: slotNamesApprove[pending.slot] || `شخصية ${pending.slot}`, inline: true },
                                { name: '👤 الاسم الكامل', value: `${pending.char_name} ${pending.family_name}`, inline: true },
                                { name: '⚧ الجنس', value: pending.gender || '—', inline: true },
                                { name: '📅 تاريخ الميلاد', value: pending.birth_date || '—', inline: true },
                                { name: '📍 مكان الولادة', value: pending.birth_place || '—', inline: true },
                                { name: '🏦 الإيبان الخاص بك', value: `\`${char.iban}\``, inline: true },
                            )
                            .setFooter({ text: 'بوت FANTASY • نظام الهوية' })
                            .setTimestamp();
                        await user.send({ embeds: [approveDmEmbed] });
                    } catch {}
                } else {
                    await db.updatePendingStatus(pendingId, 'rejected');
                    await db.addCharacterLog(pending.discord_id, pending.username, 'rejected', pending.char_name, pending.slot, `رفضه: ${interaction.user.username}`);

                    const resultEmbed = new EmbedBuilder()
                        .setTitle('❌ تم رفض طلب الهوية')
                        .setColor(0xB71C1C)
                        .addFields(
                            { name: '👤 المستخدم', value: `<@${pending.discord_id}>`, inline: true },
                            { name: '📋 الشخصية', value: `شخصية ${pending.slot}: **${pending.char_name} ${pending.family_name}**`, inline: true },
                            { name: '❌ رفضه', value: `<@${interaction.user.id}>`, inline: true },
                        )
                        .setFooter({ text: 'نظام الهوية • بوت FANTASY' }).setTimestamp();
                    sendToCharLog(resultEmbed);
                    await interaction.update({ embeds: [resultEmbed], components: [] });

                    try {
                        const user = await client.users.fetch(pending.discord_id);
                        const slotNamesReject = { 1: 'الشخصية الأولى', 2: 'الشخصية الثانية', 3: 'الشخصية الثالثة' };
                        const dmEmbed = new EmbedBuilder()
                            .setTitle('❌ تم رفض طلب الهوية')
                            .setColor(0xB71C1C)
                            .setDescription('للأسف، تم رفض طلب إنشاء هويتك. يمكنك إعادة المحاولة أو التواصل مع الإدارة.')
                            .addFields(
                                { name: '📌 الشخصية', value: slotNamesReject[pending.slot] || `شخصية ${pending.slot}`, inline: true },
                                { name: '🪪 الاسم المقدّم', value: `${pending.char_name} ${pending.family_name}`, inline: true },
                                { name: '❌ رفضه', value: interaction.user.username, inline: true },
                            )
                            .setFooter({ text: 'بوت FANTASY • نظام الهوية' })
                            .setTimestamp();
                        await user.send({ embeds: [dmEmbed] });
                    } catch {}
                }
            } catch (e) {
                console.error(e);
                if (!interaction.replied && !interaction.deferred) interaction.reply({ content: 'حدث خطأ.', flags: 64 });
            }
            return;
        }

        if (['bank_balance','bank_deposit','bank_withdraw','bank_transfer'].includes(interaction.customId)) {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder: ARB } = require('discord.js');

                if (interaction.customId === 'bank_balance') {
                    const identity = await db.getActiveIdentity(interaction.user.id);
                    const SLOT_NAMES_B = { 1: 'الشخصية الأولى', 2: 'الشخصية الثانية', 3: 'الشخصية الثالثة' };
                    const embed = new EmbedBuilder()
                        .setTitle('💰 عرض الأموال')
                        .setColor(0x1565C0)
                        .addFields(
                            { name: '👤 الاسم', value: `${identity.character_name || '—'} ${identity.family_name || ''}`, inline: true },
                            { name: '📌 الشخصية', value: SLOT_NAMES_B[identity.slot] || `شخصية ${identity.slot}`, inline: true },
                            { name: '\u200b', value: '\u200b', inline: true },
                            { name: '🏦 رصيد البنك', value: `\`${Number(identity.balance).toLocaleString()} ريال\``, inline: true },
                            { name: '💵 الكاش', value: `\`${Number(identity.cash || 0).toLocaleString()} ريال\``, inline: true },
                            { name: '🏦 الإيبان', value: `\`${identity.iban}\``, inline: true },
                            { name: '🔒 الحالة', value: identity.frozen ? '❄️ مجمّد' : '✅ نشط', inline: true },
                        )
                        .setFooter({ text: 'نظام البنك • بوت FANTASY' })
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }

                if (interaction.customId === 'bank_deposit') {
                    const identity = await db.getActiveIdentity(interaction.user.id);
                    if (identity.frozen) return interaction.reply({ content: '❄️ حسابك مجمّد.', flags: 64 });
                    const modal = new ModalBuilder().setCustomId('bank_deposit_modal').setTitle('📥 إيداع الكاش في البنك');
                    modal.addComponents(new ARB().addComponents(
                        new TextInputBuilder().setCustomId('deposit_amount').setLabel('المبلغ المراد إيداعه (ريال)').setStyle(TextInputStyle.Short).setRequired(true)
                    ));
                    return interaction.showModal(modal);
                }

                if (interaction.customId === 'bank_withdraw') {
                    const identity = await db.getActiveIdentity(interaction.user.id);
                    if (identity.frozen) return interaction.reply({ content: '❄️ حسابك مجمّد.', flags: 64 });
                    const modal = new ModalBuilder().setCustomId('bank_withdraw_modal').setTitle('💸 صرف الكاش من البنك');
                    modal.addComponents(new ARB().addComponents(
                        new TextInputBuilder().setCustomId('withdraw_amount').setLabel('المبلغ المراد صرفه (ريال)').setStyle(TextInputStyle.Short).setRequired(true)
                    ));
                    return interaction.showModal(modal);
                }

                if (interaction.customId === 'bank_transfer') {
                    const identity = await db.getActiveIdentity(interaction.user.id);
                    if (identity.frozen) return interaction.reply({ content: '❄️ حسابك مجمّد.', flags: 64 });
                    const modal = new ModalBuilder().setCustomId('bank_transfer_modal').setTitle('🔄 تحويل بنكي');
                    modal.addComponents(
                        new ARB().addComponents(new TextInputBuilder().setCustomId('transfer_iban').setLabel('إيبان المستلم (7 أرقام)').setStyle(TextInputStyle.Short).setMinLength(7).setMaxLength(7).setRequired(true)),
                        new ARB().addComponents(new TextInputBuilder().setCustomId('transfer_amount').setLabel('المبلغ (ريال)').setStyle(TextInputStyle.Short).setRequired(true)),
                        new ARB().addComponents(new TextInputBuilder().setCustomId('transfer_note').setLabel('ملاحظة (اختياري)').setStyle(TextInputStyle.Short).setRequired(false)),
                    );
                    return interaction.showModal(modal);
                }
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ.', flags: 64 });
            }
        }

        if (['snap_create','snap_send','snap_inbox','snap_friends','snap_add','snap_requests'].includes(interaction.customId)) {
            const { ModalBuilder: MSN, TextInputBuilder: TISN, TextInputStyle: TSSN, ActionRowBuilder: ARSN, StringSelectMenuBuilder: SSSN } = require('discord.js');
            await db.ensureUser(interaction.user.id, interaction.user.username);

            if (interaction.customId === 'snap_create') {
                const acc = await db.getSnapAccount(interaction.user.id);
                if (acc) return interaction.reply({ content: `❌ لديك حساب بالفعل: **${acc.snap_username}**`, flags: 64 });
                const modal = new MSN().setCustomId('snap_create_modal').setTitle('👻 إنشاء حساب سناب')
                    .addComponents(new ARSN().addComponents(
                        new TISN().setCustomId('snap_user').setLabel('اسم الحساب')
                            .setStyle(TSSN.Short).setRequired(true).setMinLength(3).setMaxLength(20)
                            .setPlaceholder('مثال: Sultan2025')
                    ));
                return interaction.showModal(modal);
            }

            if (interaction.customId === 'snap_send') {
                const acc = await db.getSnapAccount(interaction.user.id);
                if (!acc) return interaction.reply({ content: '❌ ليس لديك حساب سناب. أنشئ حساباً أولاً.', flags: 64 });
                const friends = await db.getSnapFriends(interaction.user.id);
                if (!friends.length) return interaction.reply({ content: '❌ ليس لديك أصدقاء بعد. أضف صديقاً أولاً.', flags: 64 });
                const options = friends.slice(0, 25).map(f => ({
                    label: f.friend_username,
                    value: f.friend_id,
                    description: `🔥 ستريك: ${f.streak}`,
                }));
                const row = new ARSN().addComponents(
                    new SSSN().setCustomId('snap_friend_select').setPlaceholder('👻 اختر صديق لإرسال سناب').addOptions(options)
                );
                return interaction.reply({ content: '📸 **اختر الصديق الذي تريد إرسال سناب له:**', components: [row], flags: 64 });
            }

            if (interaction.customId === 'snap_inbox') {
                const acc = await db.getSnapAccount(interaction.user.id);
                if (!acc) return interaction.reply({ content: '❌ ليس لديك حساب سناب.', flags: 64 });
                const msgs = await db.getSnapInbox(interaction.user.id);
                const embed = new EmbedBuilder()
                    .setTitle('📬 صندوق السنابات الواردة')
                    .setColor(0xFFFC00)
                    .setFooter({ text: 'سناب شات • بوت FANTASY' })
                    .setTimestamp();
                if (!msgs.length) {
                    embed.setDescription('> 📭 لا توجد سنابات واردة');
                } else {
                    const unseen = msgs.filter(m => !m.seen);
                    embed.setDescription(`📩 **${unseen.length}** سناب جديد غير مقروء`);
                    const fields = msgs.slice(0, 10).map(m => ({
                        name: `${m.seen ? '📖' : '🔴'} من: **${m.sender_username}**`,
                        value: `> ${m.content}\n⏰ ${new Date(m.created_at).toLocaleString('ar-SA')}`,
                        inline: false,
                    }));
                    embed.addFields(fields);
                    for (const m of msgs.filter(m => !m.seen)) await db.markSnapSeen(m.id, interaction.user.id);
                }
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            if (interaction.customId === 'snap_friends') {
                const acc = await db.getSnapAccount(interaction.user.id);
                if (!acc) return interaction.reply({ content: '❌ ليس لديك حساب سناب.', flags: 64 });
                const friends = await db.getSnapFriends(interaction.user.id);
                const embed = new EmbedBuilder()
                    .setTitle('👥 أصدقائي على سناب')
                    .setColor(0xFFFC00)
                    .setFooter({ text: `${friends.length} صديق • سناب شات • بوت FANTASY` })
                    .setTimestamp();
                if (!friends.length) {
                    embed.setDescription('> لا يوجد أصدقاء بعد. استخدم **➕ إضافة صديق**');
                } else {
                    const SPACER = { name: '\u200b', value: '\u200b', inline: true };
                    const fields = friends.map(f => {
                        const streak = f.streak;
                        const streakBadge = streak >= 100 ? '💯' : streak >= 50 ? '🏆' : streak >= 10 ? '⚡' : '🔥';
                        const mySnapped = f.my_last_snap;
                        const theirSnapped = f.their_last_snap;
                        const status = mySnapped && theirSnapped ? '✅' : mySnapped ? '⏳' : '📩';
                        return {
                            name: `👻 ${f.friend_username}`,
                            value: `${streakBadge} **${streak}** ستريك\n${status}`,
                            inline: true,
                        };
                    });
                    while (fields.length % 3 !== 0) fields.push(SPACER);
                    embed.addFields(fields);
                }
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            if (interaction.customId === 'snap_add') {
                const acc = await db.getSnapAccount(interaction.user.id);
                if (!acc) return interaction.reply({ content: '❌ ليس لديك حساب سناب. أنشئ حساباً أولاً.', flags: 64 });
                const modal = new MSN().setCustomId('snap_add_modal').setTitle('➕ إضافة صديق')
                    .addComponents(new ARSN().addComponents(
                        new TISN().setCustomId('friend_snap_name').setLabel('اسم حساب سناب الصديق')
                            .setStyle(TSSN.Short).setRequired(true).setMaxLength(20)
                            .setPlaceholder('مثال: Sultan2025')
                    ));
                return interaction.showModal(modal);
            }

            if (interaction.customId === 'snap_requests') {
                const acc = await db.getSnapAccount(interaction.user.id);
                if (!acc) return interaction.reply({ content: '❌ ليس لديك حساب سناب.', flags: 64 });
                const requests = await db.getPendingSnapRequests(interaction.user.id);
                const embed = new EmbedBuilder()
                    .setTitle('🔔 طلبات الصداقة الواردة')
                    .setColor(0xFFFC00)
                    .setFooter({ text: 'سناب شات • بوت FANTASY' })
                    .setTimestamp();
                if (!requests.length) {
                    embed.setDescription('> لا توجد طلبات صداقة معلّقة.');
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }
                embed.setDescription(`📩 **${requests.length}** طلب صداقة`);
                const options = requests.slice(0, 25).map(r => ({
                    label: r.requester_username,
                    value: r.requester_id,
                    description: 'اضغط للقبول',
                }));
                const row = new ARSN().addComponents(
                    new SSSN().setCustomId('snap_accept_select').setPlaceholder('✅ اختر طلباً لقبوله').addOptions(options)
                );
                return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
            }
        }

        if (['x_create_account', 'x_send_tweet', 'x_delete_account'].includes(interaction.customId)) {
            const { ModalBuilder: MBX, TextInputBuilder: TIBX, TextInputStyle: TISX, ActionRowBuilder: ARBX } = require('discord.js');
            await db.ensureUser(interaction.user.id, interaction.user.username);

            if (interaction.customId === 'x_create_account') {
                const existing = await db.getXAccount(interaction.user.id);
                if (existing) return interaction.reply({ content: `❌ لديك حساب بالفعل: **@${existing.x_username}**`, flags: 64 });
                const modal = new MBX().setCustomId('x_create_modal').setTitle('✨ إنشاء حساب X')
                    .addComponents(new ARBX().addComponents(
                        new TIBX().setCustomId('x_username').setLabel('اسم الحساب (بدون @)')
                            .setStyle(TISX.Short).setRequired(true).setMinLength(3).setMaxLength(20)
                    ));
                return interaction.showModal(modal);
            }

            if (interaction.customId === 'x_send_tweet') {
                const xChannel = await db.getConfig('x_channel');
                if (!xChannel) return interaction.reply({ content: '❌ لم يتم تحديد روم التغريدات بعد. تواصل مع المسؤولين.', flags: 64 });
                const account = await db.getXAccount(interaction.user.id);
                if (!account) return interaction.reply({ content: '❌ ليس لديك حساب على منصة X. أنشئ حساباً أولاً.', flags: 64 });
                const modal = new MBX().setCustomId('x_tweet_modal').setTitle('🐦 إرسال تغريدة')
                    .addComponents(new ARBX().addComponents(
                        new TIBX().setCustomId('tweet_content').setLabel('نص التغريدة')
                            .setStyle(TISX.Paragraph).setRequired(true).setMaxLength(280)
                    ));
                return interaction.showModal(modal);
            }

            if (interaction.customId === 'x_delete_account') {
                const account = await db.getXAccount(interaction.user.id);
                if (!account) return interaction.reply({ content: '❌ ليس لديك حساب على منصة X.', flags: 64 });
                await db.deleteXAccount(interaction.user.id);
                const embed = new EmbedBuilder()
                    .setTitle('🗑️ تم حذف حسابك')
                    .setColor(0xB71C1C)
                    .setDescription(`تم حذف حساب **@${account.x_username}** وجميع تغريداته نهائياً.`)
                    .setFooter({ text: 'منصة X • بوت FANTASY' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            }
        }

        if (['bag_view', 'bag_use', 'bag_transfer'].includes(interaction.customId)) {
            const { ModalBuilder: MB2, TextInputBuilder: TIB2, TextInputStyle: TIS2, ActionRowBuilder: ARB2, StringSelectMenuBuilder: SSM2 } = require('discord.js');
            await db.ensureUser(interaction.user.id, interaction.user.username);

            if (interaction.customId === 'bag_view') {
                const items = await db.getInventory(interaction.user.id);
                const embed = new EmbedBuilder()
                    .setTitle('🎒 محتويات حقيبتك')
                    .setColor(0xE65100)
                    .setFooter({ text: `إجمالي الأغراض: ${items.length} • نظام الحقيبة • بوت FANTASY` })
                    .setTimestamp();

                if (!items.length) {
                    embed.setDescription('> 🪹 حقيبتك فارغة حالياً');
                } else {
                    embed.setDescription(`📦 **${items.length}** غرض في حقيبتك`);
                    const SPACER = { name: '\u200b', value: '\u200b', inline: true };
                    const fields = items.map(i => ({
                        name: `┌─ ${i.item_name} ─┐`,
                        value: `📦 الكمية: \`${i.quantity}\``,
                        inline: true,
                    }));
                    // pad to multiple of 3 so rows are uniform
                    while (fields.length % 3 !== 0) fields.push(SPACER);
                    embed.addFields(fields);
                }
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            if (interaction.customId === 'bag_use') {
                const items = await db.getInventory(interaction.user.id);
                if (!items.length) return interaction.reply({ content: '❌ حقيبتك فارغة لا يوجد ما تستخدمه.', flags: 64 });
                const options = items.slice(0, 25).map(i => ({
                    label: i.item_name,
                    value: `use_${i.item_name}`,
                    description: `الكمية: ${i.quantity}`,
                }));
                const row = new ARB2().addComponents(
                    new SSM2().setCustomId('bag_use_select').setPlaceholder('اختر الغرض للاستخدام').addOptions(options)
                );
                return interaction.reply({ content: '✅ **اختر الغرض الذي تريد استخدامه:**', components: [row], flags: 64 });
            }

            if (interaction.customId === 'bag_transfer') {
                const modal = new MB2()
                    .setCustomId('bag_transfer_modal')
                    .setTitle('📤 تحويل غرض')
                    .addComponents(
                        new ARB2().addComponents(
                            new TIB2().setCustomId('transfer_item_name').setLabel('اسم الغرض')
                                .setStyle(TIS2.Short).setRequired(true).setMaxLength(50)
                        ),
                        new ARB2().addComponents(
                            new TIB2().setCustomId('transfer_iban').setLabel('إيبان المستلِم')
                                .setStyle(TIS2.Short).setRequired(true).setMaxLength(20)
                        ),
                    );
                return interaction.showModal(modal);
            }
        }

        return;
    }

    if (interaction.isStringSelectMenu()) {
        const value = interaction.values[0];

        if (interaction.customId === 'showroom_menu') {
            const carId = parseInt(value.replace('car_', ''));
            try {
                const cars = await db.getShowroom();
                const car = cars.find(c => c.id === carId);
                if (!car) return interaction.reply({ content: '❌ السيارة غير موجودة أو تم بيعها.', flags: 64 });
                const embed = new EmbedBuilder()
                    .setTitle(`🚗 ${car.car_name}`)
                    .setColor(0xB71C1C)
                    .addFields(
                        { name: '🏷️ النوع', value: car.car_type ? `\`${car.car_type}\`` : '`غير محدد`', inline: true },
                        { name: '🎨 اللون', value: car.color ? `\`${car.color}\`` : '`غير محدد`', inline: true },
                        { name: '💰 السعر', value: `\`${Number(car.price).toLocaleString()} ريال\``, inline: true },
                        { name: '📋 الحالة', value: '`متاحة للبيع`', inline: true },
                        { name: '📩 للشراء', value: 'تواصل مع الإدارة لإتمام عملية الشراء', inline: false },
                    )
                    .setFooter({ text: 'نظام المعارض • بوت FANTASY' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'identity_menu') {
            await db.ensureUser(interaction.user.id, interaction.user.username);
            try {
                if (value === 'create_identity') {
                    const [identities, slot3Open] = await Promise.all([
                        db.getUserIdentities(interaction.user.id),
                        db.isSlot3Unlocked(interaction.user.id),
                    ]);
                    const slotNames = { 1: 'الشخصية الأولى', 2: 'الشخصية الثانية', 3: 'الشخصية الثالثة' };
                    const slotOptions = [1, 2, 3].map(s => {
                        if (s === 3 && !slot3Open) {
                            return { label: '🔒 الشخصية الثالثة', value: `create_slot_${s}`, description: 'مقفلة — تواصل مع المسؤولين لفتحها' };
                        }
                        const taken = identities.find(i => i.slot === s && i.character_name);
                        return {
                            label: slotNames[s],
                            value: `create_slot_${s}`,
                            description: taken ? '🔒 مكتملة بالفعل' : '🟢 متاحة للإنشاء',
                        };
                    });
                    const slotRow = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('identity_create_slot')
                            .setPlaceholder('اختر الشخصية')
                            .addOptions(slotOptions)
                    );
                    return interaction.reply({ content: '📋 **اختر الشخصية التي تريد إنشاء هويتها:**', components: [slotRow], flags: 64 });
                }

                if (value === 'login_identity') {
                    const tripOpen = await db.getConfig('trip_open');
                    if (tripOpen !== 'true') {
                        return interaction.reply({ content: '❌ **تسجيل الدخول متوقف حالياً.**\nلا يمكن تسجيل الدخول إلا عند فتح رحلة. انتظر إعلان المسؤولين.', flags: 64 });
                    }
                    const identities = await db.getUserIdentities(interaction.user.id);
                    const created = identities.filter(i => i.character_name);
                    if (!created.length) return interaction.reply({ content: '❌ لا توجد شخصيات مُنشأة ومقبولة بعد. قدّم طلب هوية أولاً.', flags: 64 });
                    const loginSlotNames = { 1: 'الشخصية الأولى', 2: 'الشخصية الثانية', 3: 'الشخصية الثالثة' };
                    const slotOptions = created.map(i => ({
                        label: `${loginSlotNames[i.slot]}: ${i.character_name} ${i.family_name || ''}`,
                        value: `login_slot_${i.slot}`,
                        description: `${i.gender || '—'} • ${i.birth_date || '—'}`,
                    }));
                    const slotRow = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('identity_login_slot')
                            .setPlaceholder('اختر الشخصية للدخول')
                            .addOptions(slotOptions)
                    );
                    return interaction.reply({ content: '✅ **اختر الشخصية التي تريد تسجيل الدخول بها:**', components: [slotRow], flags: 64 });
                }

                if (value === 'logout_identity') {
                    const status = await db.getLoginStatus(interaction.user.id);
                    if (!status.is_logged_in) return interaction.reply({ content: '❌ أنت لست مسجّل دخول بأي شخصية حالياً.', flags: 64 });
                    const identities = await db.getUserIdentities(interaction.user.id);
                    const activeChar = identities.find(i => i.slot === status.active_slot);
                    const slotNamesOut = { 1: 'الشخصية الأولى', 2: 'الشخصية الثانية', 3: 'الشخصية الثالثة' };
                    await db.logoutIdentity(interaction.user.id);
                    await db.addCharacterLog(interaction.user.id, interaction.user.username, 'logout', activeChar?.character_name || null, status.active_slot);
                    const embedOut = new EmbedBuilder()
                        .setTitle('🚪 تسجيل الخروج')
                        .setColor(0x757575)
                        .addFields(
                            { name: '👤 المستخدم', value: `<@${interaction.user.id}>`, inline: true },
                            { name: '🪪 الشخصية', value: `${slotNamesOut[status.active_slot] || `شخصية ${status.active_slot}`}: **${activeChar?.character_name || '—'} ${activeChar?.family_name || ''}**`, inline: true },
                        )
                        .setFooter({ text: 'نظام الهوية • بوت FANTASY' })
                        .setTimestamp();
                    sendToCharLog(embedOut);
                    return interaction.reply({ embeds: [embedOut] });
                }
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'identity_create_slot') {
            const slot = parseInt(value.replace('create_slot_', ''));
            const NAMES = ['', 'الشخصية الأولى', 'الشخصية الثانية', 'الشخصية الثالثة'];
            if (slot === 3) {
                const unlocked = await db.isSlot3Unlocked(interaction.user.id);
                if (!unlocked) return interaction.reply({ content: '🔒 **الشخصية الثالثة** غير مفتوحة. تواصل مع المسؤولين لفتحها.', flags: 64 });
            }
            const identities = await db.getUserIdentities(interaction.user.id);
            const taken = identities.find(i => i.slot === slot && i.character_name);
            if (taken) {
                return interaction.reply({ content: `❌ **${NAMES[slot]}** مكتملة بالفعل ولا يمكن إنشاء هوية جديدة فيها.`, flags: 64 });
            }
            const slotNames = { 1: 'الشخصية الأولى', 2: 'الشخصية الثانية', 3: 'الشخصية الثالثة' };
            const modal = new ModalBuilder()
                .setCustomId(`create_char_${slot}`)
                .setTitle(`✏️ إنشاء هوية — ${slotNames[slot]}`)
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('char_name').setLabel('اسم الشخصية')
                            .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('family_name').setLabel('اسم العائلة')
                            .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('birth_place').setLabel('اسم ومكان الولادة')
                            .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('birth_date').setLabel('تاريخ الميلاد (مثال: 1990/06/15)')
                            .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('gender').setLabel('الجنس (ذكر / أنثى)')
                            .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10)
                    )
                );
            return interaction.showModal(modal);
        }

        if (interaction.customId === 'identity_login_slot') {
            const slot = parseInt(value.replace('login_slot_', ''));
            try {
                await db.loginIdentity(interaction.user.id, slot);
                const identities = await db.getUserIdentities(interaction.user.id);
                const char = identities.find(i => i.slot === slot);
                await db.addCharacterLog(interaction.user.id, interaction.user.username, 'login', char.character_name, slot);
                const slotNamesLogin = { 1: 'الشخصية الأولى', 2: 'الشخصية الثانية', 3: 'الشخصية الثالثة' };
                const embed = new EmbedBuilder()
                    .setTitle(`✅ تسجيل الدخول — ${slotNamesLogin[slot]}`)
                    .setColor(0x2E7D32)
                    .addFields(
                        { name: '👤 الاسم', value: `${char.character_name} ${char.family_name || ''}`, inline: true },
                        { name: '⚧ الجنس', value: char.gender || '—', inline: true },
                        { name: '📅 تاريخ الميلاد', value: char.birth_date || '—', inline: true },
                        { name: '📍 مكان الولادة', value: char.birth_place || '—', inline: true },
                        { name: '👤 المستخدم', value: `<@${interaction.user.id}>`, inline: true },
                    )
                    .setFooter({ text: 'نظام الهوية • بوت FANTASY' })
                    .setTimestamp();
                sendToCharLog(embed);
                return interaction.reply({ embeds: [embed] });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ أثناء تسجيل الدخول.', flags: 64 });
            }
        }

        if (interaction.customId === 'snap_friend_select') {
            try {
                const { ModalBuilder: MSN2, TextInputBuilder: TISN2, TextInputStyle: TSSN2, ActionRowBuilder: ARSN2 } = require('discord.js');
                const receiverId = value;
                const receiverAcc = await db.getSnapAccount(receiverId);
                const modal = new MSN2()
                    .setCustomId(`snap_send_modal_${receiverId}`)
                    .setTitle(`📸 إرسال سناب لـ ${receiverAcc?.snap_username || 'صديق'}`)
                    .addComponents(new ARSN2().addComponents(
                        new TISN2().setCustomId('snap_content').setLabel('محتوى السناب')
                            .setStyle(TSSN2.Paragraph).setRequired(true).setMaxLength(300)
                    ));
                return interaction.showModal(modal);
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'snap_accept_select') {
            try {
                const requesterId = value;
                const requesterAcc = await db.getSnapAccount(requesterId);
                const done = await db.acceptSnapFriend(interaction.user.id, requesterId);
                if (!done) return interaction.reply({ content: '❌ لم يُعثر على الطلب.', flags: 64 });
                const embed = new EmbedBuilder()
                    .setTitle('✅ تم قبول طلب الصداقة')
                    .setColor(0xFFFC00)
                    .setDescription(`أنتما الآن أصدقاء مع **${requesterAcc?.snap_username || requesterId}** 👻`)
                    .setFooter({ text: 'سناب شات • بوت FANTASY' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'bag_use_select') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const itemName = value.replace(/^use_/, '');
                const result = await db.useItem(interaction.user.id, itemName);
                if (!result.success) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });
                const embed = new EmbedBuilder()
                    .setTitle('✅ تم استخدام الغرض')
                    .setColor(0x2E7D32)
                    .addFields(
                        { name: '🎒 الغرض', value: `**${itemName}**`, inline: true },
                        { name: '📦 الكمية المتبقية', value: `\`${result.remainingQty}\``, inline: true },
                    )
                    .setFooter({ text: 'نظام الحقيبة • بوت FANTASY' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'vehicles_menu') {
            if (value === 'view') {
                try {
                    await db.ensureUser(interaction.user.id, interaction.user.username);
                    const cars = await db.getVehicles(interaction.user.id);
                    const embed = new EmbedBuilder()
                        .setTitle('🚗 سياراتي المسجلة')
                        .setColor(0x37474F)
                        .setDescription(cars.length
                            ? cars.map(c => `🚗 **${c.car_name}** — لوحة: \`${c.plate}\``).join('\n')
                            : '> لا توجد سيارات مسجلة بعد')
                        .addFields({ name: '🔢 عدد السيارات', value: `\`${cars.length}\``, inline: true })
                        .setFooter({ text: 'نظام السيارات • بوت FANTASY' })
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], flags: 64 });
                } catch (e) {
                    console.error(e);
                    return interaction.reply({ content: 'حدث خطأ.', flags: 64 });
                }
            }
        }


        if (interaction.customId === 'x_menu') {
            const postId = parseInt(value.replace('like_', ''));
            try {
                await db.likePost(postId);
                return interaction.reply({ content: `❤️ أعجبك المنشور **#${postId}**`, flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'events_menu') {
            try {
                if (value === 'hurricane') {
                    await db.setConfig('hurricane_active', 'true');
                    await db.setConfig('trip_open', 'false');
                    await db.logoutAllUsers();
                    await db.addCharacterLog('system', 'system', 'hurricane_logout', 'جميع اللاعبين', 0, 'إعصار — خروج تلقائي لجميع اللاعبين');
                    const hurricaneEmbed = new EmbedBuilder()
                        .setTitle('🌀 تحذير — إعصار!')
                        .setColor(0xB71C1C)
                        .setDescription('⚠️ **تم تفعيل حدث الإعصار!**\n\n🚪 تم تسجيل خروج **جميع اللاعبين** تلقائياً.\n✈️ **تسجيل الدخول متوقف** حتى يتم فتح رحلة جديدة.')
                        .addFields({ name: '🔧 فعّله', value: `<@${interaction.user.id}>`, inline: true })
                        .setFooter({ text: 'نظام الأحداث • بوت FANTASY' })
                        .setTimestamp();
                    sendToCharLog(hurricaneEmbed);
                    return interaction.reply({ embeds: [hurricaneEmbed] });
                }
                if (value === 'open_flight') {
                    await db.setConfig('trip_open', 'true');
                    await db.setConfig('hurricane_active', 'false');
                    const flightEmbed = new EmbedBuilder()
                        .setTitle('✈️ تم فتح الرحلة!')
                        .setColor(0x2E7D32)
                        .setDescription('✅ **الرحلة مفتوحة الآن!**\n\n🎉 يمكن لجميع اللاعبين **تسجيل الدخول** بشخصياتهم.')
                        .addFields({ name: '🔧 فتحها', value: `<@${interaction.user.id}>`, inline: true })
                        .setFooter({ text: 'نظام الأحداث • بوت FANTASY' })
                        .setTimestamp();
                    sendToCharLog(flightEmbed);
                    return interaction.reply({ embeds: [flightEmbed] });
                }
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ.', flags: 64 });
            }
        }

        const handler = menuHandlers[interaction.customId];
        if (!handler) return;
        const response = handler[value];
        if (!response) return interaction.reply({ content: 'لا توجد معلومات لهذا الخيار.', flags: 64 });
        return interaction.reply({ content: response, flags: 64 });
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'bank_deposit_modal') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const amount = parseInt(interaction.fields.getTextInputValue('deposit_amount').replace(/,/g, ''));
                if (isNaN(amount) || amount <= 0)
                    return interaction.reply({ content: '❌ المبلغ غير صحيح.', flags: 64 });
                const result = await db.depositCash(interaction.user.id, amount);
                if (!result.success) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });
                const embed = new EmbedBuilder()
                    .setTitle('📥 تم إيداع الكاش في البنك')
                    .setColor(0x2E7D32)
                    .addFields(
                        { name: '💵 الكاش المودَع', value: `\`${amount.toLocaleString()} ريال\``, inline: true },
                        { name: '🏦 رصيد البنك الجديد', value: `\`${(Number(result.sender.balance) + amount).toLocaleString()} ريال\``, inline: true },
                        { name: '💵 الكاش المتبقي', value: `\`${(Number(result.sender.cash) - amount).toLocaleString()} ريال\``, inline: true },
                    )
                    .setFooter({ text: 'نظام البنك • بوت FANTASY' }).setTimestamp();
                return interaction.reply({ embeds: [embed] });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'bank_withdraw_modal') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const amount = parseInt(interaction.fields.getTextInputValue('withdraw_amount').replace(/,/g, ''));
                if (isNaN(amount) || amount <= 0)
                    return interaction.reply({ content: '❌ المبلغ غير صحيح.', flags: 64 });
                const result = await db.withdrawCash(interaction.user.id, amount);
                if (!result.success) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });
                const embed = new EmbedBuilder()
                    .setTitle('💸 تم صرف الكاش من البنك')
                    .setColor(0xB71C1C)
                    .addFields(
                        { name: '💵 الكاش المصروف', value: `\`${amount.toLocaleString()} ريال\``, inline: true },
                        { name: '🏦 رصيد البنك الجديد', value: `\`${(Number(result.sender.balance) - amount).toLocaleString()} ريال\``, inline: true },
                        { name: '💵 الكاش الجديد', value: `\`${(Number(result.sender.cash) + amount).toLocaleString()} ريال\``, inline: true },
                    )
                    .setFooter({ text: 'نظام البنك • بوت FANTASY' }).setTimestamp();
                return interaction.reply({ embeds: [embed] });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'bank_transfer_modal') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const toIban  = interaction.fields.getTextInputValue('transfer_iban').trim();
                const rawAmt  = interaction.fields.getTextInputValue('transfer_amount').trim().replace(/,/g, '');
                const note    = interaction.fields.getTextInputValue('transfer_note').trim() || null;
                const amount  = parseInt(rawAmt);
                if (isNaN(amount) || amount <= 0)
                    return interaction.reply({ content: '❌ المبلغ غير صحيح. أدخل رقماً موجباً.', flags: 64 });

                const result = await db.transferMoney(interaction.user.id, toIban, amount, note);
                if (!result.success)
                    return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });

                const SLOT_NAMES = { 1: 'الشخصية الأولى', 2: 'الشخصية الثانية', 3: 'الشخصية الثالثة' };
                const embed = new EmbedBuilder()
                    .setTitle('✅ تم التحويل بنجاح')
                    .setColor(0x1565C0)
                    .addFields(
                        { name: '👤 المرسِل', value: `${result.sender.character_name} ${result.sender.family_name || ''} (${SLOT_NAMES[result.sender.slot] || `شخصية ${result.sender.slot}`})`, inline: false },
                        { name: '🏦 إيبانك', value: `\`${result.sender.iban}\``, inline: true },
                        { name: '💰 رصيدك بعد التحويل', value: `\`${(Number(result.sender.balance) - amount).toLocaleString()} ريال\``, inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: '📨 المستلِم', value: `${result.receiver.character_name} ${result.receiver.family_name || ''}`, inline: true },
                        { name: '🏦 إيبان المستلِم', value: `\`${toIban}\``, inline: true },
                        { name: '💸 المبلغ المحوَّل', value: `\`${amount.toLocaleString()} ريال\``, inline: true },
                        { name: '📝 ملاحظة', value: note || '—', inline: false },
                    )
                    .setFooter({ text: 'نظام البنك • بوت FANTASY' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed] });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ أثناء التحويل.', flags: 64 });
            }
        }

        if (interaction.customId === 'x_create_modal') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const xUsername = interaction.fields.getTextInputValue('x_username').trim().replace(/\s+/g, '_');
                const result = await db.createXAccount(interaction.user.id, xUsername);
                if (!result.success) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });
                const embed = new EmbedBuilder()
                    .setTitle('✅ تم إنشاء حسابك على منصة X')
                    .setColor(0x000000)
                    .addFields({ name: '👤 اسم الحساب', value: `**@${xUsername}**`, inline: true })
                    .setFooter({ text: 'منصة X • بوت FANTASY' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ أثناء إنشاء الحساب.', flags: 64 });
            }
        }

        if (interaction.customId === 'snap_create_modal') {
            try {
                const snapUsername = interaction.fields.getTextInputValue('snap_user').trim();
                if (!/^[\w\u0600-\u06FF]{3,20}$/.test(snapUsername))
                    return interaction.reply({ content: '❌ اسم الحساب يجب أن يكون 3-20 حرف بدون مسافات.', flags: 64 });
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const result = await db.createSnapAccount(interaction.user.id, snapUsername);
                if (!result.success) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });
                const embed = new EmbedBuilder()
                    .setTitle('👻 مرحباً بك في سناب شات!')
                    .setColor(0xFFFC00)
                    .setDescription(`تم إنشاء حسابك **@${snapUsername}** بنجاح!\nأضف أصدقاء وابدأ إرسال السنابات 🎉`)
                    .setFooter({ text: 'سناب شات • بوت FANTASY' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed] });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'snap_add_modal') {
            try {
                const friendName = interaction.fields.getTextInputValue('friend_snap_name').trim();
                const myAcc = await db.getSnapAccount(interaction.user.id);
                if (!myAcc) return interaction.reply({ content: '❌ ليس لديك حساب سناب.', flags: 64 });
                const friendAcc = await db.getSnapAccountByUsername(friendName);
                if (!friendAcc) return interaction.reply({ content: `❌ لا يوجد حساب باسم **${friendName}**.`, flags: 64 });
                if (friendAcc.discord_id === interaction.user.id) return interaction.reply({ content: '❌ لا يمكنك إضافة نفسك.', flags: 64 });
                const result = await db.addSnapFriend(interaction.user.id, friendAcc.discord_id);
                if (!result.success) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });
                // notify via DM
                try {
                    const targetUser = await client.users.fetch(friendAcc.discord_id);
                    const notif = new EmbedBuilder()
                        .setTitle('👻 طلب صداقة جديد على سناب!')
                        .setColor(0xFFFC00)
                        .setDescription(`**@${myAcc.snap_username}** يريد إضافتك كصديق على سناب شات!\nاستخدم **زر الطلبات 🔔** لقبول الطلب.`)
                        .setFooter({ text: 'سناب شات • بوت FANTASY' })
                        .setTimestamp();
                    await targetUser.send({ embeds: [notif] });
                } catch (_) {}
                const embed = new EmbedBuilder()
                    .setTitle('✅ تم إرسال طلب الصداقة')
                    .setColor(0xFFFC00)
                    .setDescription(`أُرسل طلب صداقة لـ **@${friendAcc.snap_username}** 👻\nسيتم إشعاره وعليه قبول الطلب.`)
                    .setFooter({ text: 'سناب شات • بوت FANTASY' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId.startsWith('snap_send_modal_')) {
            try {
                const receiverId = interaction.customId.replace('snap_send_modal_', '');
                const content = interaction.fields.getTextInputValue('snap_content').trim();
                const myAcc = await db.getSnapAccount(interaction.user.id);
                const receiverAcc = await db.getSnapAccount(receiverId);
                if (!myAcc || !receiverAcc) return interaction.reply({ content: '❌ حساب غير موجود.', flags: 64 });
                await db.sendSnap(interaction.user.id, receiverId, content);
                // DM notification
                try {
                    const targetUser = await client.users.fetch(receiverId);
                    const notif = new EmbedBuilder()
                        .setTitle('📸 سناب جديد وصلك!')
                        .setColor(0xFFFC00)
                        .setDescription(`**@${myAcc.snap_username}** أرسل لك سناباً!\nافتح سناب شات لمشاهدته 👻`)
                        .setFooter({ text: 'سناب شات • بوت FANTASY' })
                        .setTimestamp();
                    await targetUser.send({ embeds: [notif] });
                } catch (_) {}
                const embed = new EmbedBuilder()
                    .setTitle('📸 تم إرسال السناب!')
                    .setColor(0xFFFC00)
                    .setDescription(`أُرسل سناب لـ **@${receiverAcc.snap_username}** بنجاح 👻`)
                    .setFooter({ text: 'سناب شات • بوت FANTASY' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed] });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ أثناء إرسال السناب.', flags: 64 });
            }
        }

        if (interaction.customId === 'x_tweet_modal') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const content = interaction.fields.getTextInputValue('tweet_content').trim();
                const account = await db.getXAccount(interaction.user.id);
                if (!account) return interaction.reply({ content: '❌ ليس لديك حساب على منصة X.', flags: 64 });
                const xChannelId = await db.getConfig('x_channel');
                if (!xChannelId) return interaction.reply({ content: '❌ لم يتم تحديد روم التغريدات. تواصل مع المسؤولين.', flags: 64 });
                const post = await db.postTweet(interaction.user.id, content);
                const embed = new EmbedBuilder()
                    .setTitle('𝕏 تغريدة جديدة')
                    .setColor(0x000000)
                    .setDescription(`> ${content}`)
                    .addFields(
                        { name: '👤 الحساب', value: `**@${account.x_username}**`, inline: true },
                        { name: '🆔 رقم المنشور', value: `\`#${post.id}\``, inline: true },
                        { name: '❤️ الإعجابات', value: '`0`', inline: true },
                    )
                    .setFooter({ text: 'منصة X • بوت FANTASY' })
                    .setTimestamp();
                const xChannel = interaction.guild?.channels?.cache.get(xChannelId);
                if (xChannel) await xChannel.send({ embeds: [embed] });
                return interaction.reply({ content: `✅ تم نشر تغريدتك في <#${xChannelId}>`, flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ أثناء نشر التغريدة.', flags: 64 });
            }
        }

        if (interaction.customId === 'bag_transfer_modal') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const itemName = interaction.fields.getTextInputValue('transfer_item_name').trim();
                const toIban   = interaction.fields.getTextInputValue('transfer_iban').trim();
                const receiver = await db.getIdentityByIban(toIban);
                if (!receiver) return interaction.reply({ content: '❌ لم يُعثر على مستخدم بهذا الإيبان.', flags: 64 });
                if (receiver.discord_id === interaction.user.id) return interaction.reply({ content: '❌ لا يمكنك تحويل غرض لنفسك.', flags: 64 });
                const result = await db.transferItem(interaction.user.id, receiver.discord_id, itemName);
                if (!result || result.success === false) return interaction.reply({ content: `❌ ${result?.error || 'الغرض غير موجود في حقيبتك أو الكمية صفر.'}`, flags: 64 });
                const embed = new EmbedBuilder()
                    .setTitle('📤 تم تحويل الغرض بنجاح')
                    .setColor(0x6A1B9A)
                    .addFields(
                        { name: '🎒 الغرض', value: `**${itemName}**`, inline: true },
                        { name: '📨 المستلِم', value: `${receiver.character_name} ${receiver.family_name || ''}`, inline: true },
                        { name: '🏦 إيبان المستلِم', value: `\`${toIban}\``, inline: true },
                    )
                    .setFooter({ text: 'نظام الحقيبة • بوت FANTASY' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ أثناء التحويل.', flags: 64 });
            }
        }

        if (interaction.customId.startsWith('create_char_')) {
            const slot = parseInt(interaction.customId.replace('create_char_', ''));
            const charName   = interaction.fields.getTextInputValue('char_name').trim();
            const familyName = interaction.fields.getTextInputValue('family_name').trim();
            const birthPlace = interaction.fields.getTextInputValue('birth_place').trim();
            const birthDate  = interaction.fields.getTextInputValue('birth_date').trim();
            const gender     = interaction.fields.getTextInputValue('gender').trim();
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const identities = await db.getUserIdentities(interaction.user.id);
                const slotTaken = identities.find(i => i.slot === slot && i.character_name);
                if (slotTaken) return interaction.reply({ content: '❌ هذه الخانة ممتلئة بالفعل. اختر خانة أخرى.', flags: 64 });

                const pending = await db.createPendingIdentity({
                    discordId: interaction.user.id,
                    username: interaction.user.username,
                    slot, charName, familyName, birthPlace, birthDate, gender
                });
                await db.addCharacterLog(interaction.user.id, interaction.user.username, 'pending', charName, slot);

                const pendingSlotNames = { 1: 'الشخصية الأولى', 2: 'الشخصية الثانية', 3: 'الشخصية الثالثة' };
                const logChannelId = await db.getConfig('identity_log_channel');
                if (logChannelId) {
                    try {
                        const logChannel = await client.channels.fetch(logChannelId);
                        if (logChannel) {
                            const logEmbed = new EmbedBuilder()
                                .setTitle('📋 طلب هوية جديد — بانتظار المراجعة')
                                .setColor(0xF57F17)
                                .setThumbnail(interaction.user.displayAvatarURL())
                                .addFields(
                                    { name: '👤 المستخدم',        value: `<@${interaction.user.id}> — \`${interaction.user.username}\``, inline: false },
                                    { name: '📌 الشخصية',          value: pendingSlotNames[slot], inline: true },
                                    { name: '👤 الاسم الأول',     value: charName, inline: true },
                                    { name: '👥 اسم العائلة',     value: familyName, inline: true },
                                    { name: '⚧ الجنس',             value: gender, inline: true },
                                    { name: '📅 تاريخ الميلاد',   value: birthDate, inline: true },
                                    { name: '📍 مكان الولادة',    value: birthPlace, inline: true },
                                    { name: '🆔 رقم الطلب',       value: `\`#${pending.id}\``, inline: true },
                                )
                                .setFooter({ text: 'نظام الهوية • بوت FANTASY' })
                                .setTimestamp();
                            const btnRow = new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setCustomId(`approve_identity_${pending.id}`).setLabel('✅ قبول').setStyle(ButtonStyle.Success),
                                new ButtonBuilder().setCustomId(`reject_identity_${pending.id}`).setLabel('❌ رفض').setStyle(ButtonStyle.Danger)
                            );
                            await logChannel.send({ embeds: [logEmbed], components: [btnRow] });
                        }
                    } catch (e) { console.error('log channel error:', e); }
                }

                const pendingNamesLog = { 1: 'الشخصية الأولى', 2: 'الشخصية الثانية', 3: 'الشخصية الثالثة' };
                const pendingLogEmbed = new EmbedBuilder()
                    .setTitle('⏳ طلب هوية جديد')
                    .setColor(0xF57F17)
                    .addFields(
                        { name: '👤 المستخدم', value: `<@${interaction.user.id}>`, inline: true },
                        { name: '📌 الشخصية', value: pendingNamesLog[slot], inline: true },
                        { name: '🪪 الاسم', value: `${charName} ${familyName}`, inline: true },
                        { name: '🆔 رقم الطلب', value: `\`#${pending.id}\``, inline: true },
                    )
                    .setFooter({ text: 'نظام الهوية • بوت FANTASY' })
                    .setTimestamp();
                sendToCharLog(pendingLogEmbed);

                return interaction.reply({
                    content: `⏳ **تم إرسال طلب هويتك رقم \`#${pending.id}\` للمراجعة.**\nسيصلك رد عند قبول أو رفض الطلب.`,
                    flags: 64
                });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ أثناء إرسال الطلب.', flags: 64 });
            }
        }
        return;
    }

    if (!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.slashExecute(interaction, db);
    } catch (error) {
        console.error(error);
        interaction.reply({ content: 'حدث خطأ أثناء تنفيذ الأمر!', flags: 64 });
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    const prefix = process.env.PREFIX || '-';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift();
    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args, db);
    } catch (error) {
        console.error(error);
        message.reply('حدث خطأ أثناء تنفيذ الأمر!');
    }
});

client.login(process.env.DISCORD_TOKEN);
