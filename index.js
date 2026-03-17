const fs = require('fs');

/* ── منع تشغيل أكثر من نسخة واحدة ─────────────────────────────────────── */
const PID_FILE = '/tmp/fantasy_bot.pid';
if (fs.existsSync(PID_FILE)) {
    const oldPid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
    if (!isNaN(oldPid) && oldPid !== process.pid) {
        try { process.kill(oldPid, 'SIGKILL'); console.log(`[PID] قُتلت النسخة القديمة (${oldPid})`); }
        catch (_) {}
    }
}
fs.writeFileSync(PID_FILE, String(process.pid));
const cleanupPid = () => { try { fs.unlinkSync(PID_FILE); } catch (_) {} };
process.on('exit',   cleanupPid);
process.on('SIGTERM', () => { cleanupPid(); process.exit(0); });
process.on('SIGINT',  () => { cleanupPid(); process.exit(0); });
/* ───────────────────────────────────────────────────────────────────────── */

const {
    Client, Collection, GatewayIntentBits, EmbedBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    ActionRowBuilder, StringSelectMenuBuilder,
    ButtonBuilder, ButtonStyle, PermissionFlagsBits
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
    setInterval(async () => {
        try {
            await db.updateAllJobPrices();
            console.log('✅ تم تحديث أسعار الوظائف تلقائياً');
        } catch (e) {
            console.error('❌ خطأ في تحديث أسعار الوظائف:', e.message);
        }
    }, 60 * 60 * 1000);
});

const menuHandlers = {
    help_menu: {
        identity: '🪪 **الهوية** — اكتب `/identity` لعرض شخصيتك والإيبان الخاص بها.',
        phone: '📱 **الجوال** — اكتب `/phone` لإرسال بلاغ شرطة 🚨 أو بلاغ إسعاف 🚑.',
        bag: '🎒 **الحقيبة** — اكتب `/bag` لعرض أغراضك. لنقل غرض: `-نقل [غرض] @مستخدم`',
        bank: '🏦 **البنك** — اكتب `/bank` لعرض رصيدك وإيبانك. لتحويل مال: `-تحويل [إيبان] [مبلغ]`',
        trips: '✈️ **الرحلات** — اكتب `/الرحلات` لفتح رحلة أو إرسال تنبيه.',
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
    bank: 'bank', bag: 'bag', identity: 'identity',
    phone: 'phone', الرحلات: 'الرحلات', jobs: 'jobs', market: 'market', 'بلاك-ماركت': 'بلاك-ماركت',
    law: 'law', admin: 'admin', crime: 'crime', health: 'health',
    tickets: 'tickets', showroom: 'معارض', vehicles: 'سيارات',
    x_platform: 'منصة-x', help: 'help', properties: 'properties',
    معدات: 'معدات',
    'سوق-مركزي': 'سوق-مركزي',
    محاماة: 'محاماة',
    عدل: 'عدل',
    محامي: 'محامي',
    قاضي: 'قاضي',
    'مهام-محامي': 'مهام-محامي',
    تفعيل: 'تفعيل',
    تجميع: 'تجميع',
    تصنيع: 'تصنيع',
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
                    interaction._isReset = true;
                    interaction.reply = async (data) => {
                        if (!data || data?.flags === 64 ||
                            data?.content === '\u200b' || data?.content === '​') return;
                        return interaction.editReply(data);
                    };
                    await command.slashExecute(interaction, db);
                } catch (e) {
                    console.error(e);
                    try {
                        if (interaction.deferred) interaction.editReply({ content: 'حدث خطأ.' });
                    } catch {}
                }
            } else {
                await interaction.deferUpdate().catch(() => {});
            }
            return;
        }

        if (['trip_start', 'trip_hurricane', 'trip_renewal', 'trip_alert'].includes(interaction.customId)) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ هذا الزر للمسؤولين فقط.', flags: 64 });
            }

            if (interaction.customId === 'trip_hurricane') {
                const alertsChannelId = await db.getConfig('trips_alerts_channel');
                if (!alertsChannelId) return interaction.reply({ content: '❌ لم يتم تحديد روم التنبيهات. استخدم `/إعداد-رحلات` أولاً.', flags: 64 });

                await db.setConfig('hurricane_active', 'true');
                await db.setConfig('trip_open', 'false');
                await db.logoutAllUsers();
                await db.addCharacterLog('system', 'system', 'hurricane_logout', 'جميع اللاعبين', 0, 'إعصار — خروج تلقائي لجميع اللاعبين');

                const hurricaneEmbed = new EmbedBuilder()
                    .setTitle('🌪️ تحذير — إعصار!')
                    .setColor(0xB71C1C)
                    .setDescription('⚠️ **تم تفعيل حدث الإعصار!**\n\n🚪 تم تسجيل خروج **جميع اللاعبين** تلقائياً.\n✈️ **تسجيل الدخول متوقف** حتى يتم فتح رحلة جديدة.')
                    .addFields({ name: '🔧 فعّله', value: `<@${interaction.user.id}>`, inline: true })
                    .setFooter({ text: 'نظام الرحلات • بوت FANTASY' })
                    .setTimestamp();
                try {
                    const ch = await client.channels.fetch(alertsChannelId);
                    if (ch) await ch.send({ embeds: [hurricaneEmbed] });
                } catch {}
                return interaction.reply({ content: '✅ تم إرسال تحذير الإعصار.', flags: 64 });
            }

            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder: ARB } = require('discord.js');

            if (interaction.customId === 'trip_start') {
                const modal = new ModalBuilder().setCustomId('trip_start_modal').setTitle('بدء رحلة جديدة');
                modal.addComponents(
                    new ARB().addComponents(new TextInputBuilder().setCustomId('trip_host_id').setLabel('ID الهوست').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ARB().addComponents(new TextInputBuilder().setCustomId('trip_deputy').setLabel('نائب الهوست').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ARB().addComponents(new TextInputBuilder().setCustomId('trip_supervisor').setLabel('الرقابي').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ARB().addComponents(new TextInputBuilder().setCustomId('trip_time').setLabel('وقت الرحلة').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('مثال: 9:00 مساءً')),
                );
                return interaction.showModal(modal);
            }

            if (interaction.customId === 'trip_renewal') {
                const modal = new ModalBuilder().setCustomId('trip_renewal_modal').setTitle('تجديد الرحلة');
                modal.addComponents(
                    new ARB().addComponents(new TextInputBuilder().setCustomId('renewal_host_id').setLabel('ID الهوست').setStyle(TextInputStyle.Short).setRequired(true)),
                );
                return interaction.showModal(modal);
            }

            if (interaction.customId === 'trip_alert') {
                const modal = new ModalBuilder().setCustomId('trip_alert_modal').setTitle('إرسال تنبيه');
                modal.addComponents(
                    new ARB().addComponents(new TextInputBuilder().setCustomId('alert_text').setLabel('نص التنبيه').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                );
                return interaction.showModal(modal);
            }
        }


        if (interaction.customId.startsWith('do_job_')) {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const loginErr = await db.checkLoginAndIdentity(interaction.user.id);
                if (loginErr) return interaction.reply({ content: loginErr, flags: 64 });

                const jobKey = interaction.customId.replace('do_job_', '');
                const JOBS = {
                    fishing:     { label: '🎣 صيد السمك',   req: 'سنارة',    items: ['سمك هامور','سالمون','روبيان','حوت'], weights: [20,35,40,5], color: 0x1565C0 },
                    woodcutting: { label: '🪓 تقطيع الخشب', req: 'فأس',      items: ['خشب'],                            weights: [100],       color: 0x4E342E },
                    mining:      { label: '⛏️ المنجم',       req: 'أدوات المنجم',   items: ['الماس','ذهب','فضة','نحاس'],     weights: [5,20,35,40], color: 0x546E7A },
                };
                const job = JOBS[jobKey];
                if (!job) return;

                const hasReq = await db.hasItem(interaction.user.id, job.req);
                if (!hasReq)
                    return interaction.reply({ content: `❌ تحتاج **${job.req}** في حقيبتك لتنفيذ هذه الوظيفة.`, flags: 64 });

                const { COOLDOWN_MINUTES } = require('./commands/jobs');
                const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
                const lastUsed   = await db.getJobCooldown(interaction.user.id, jobKey);
                if (lastUsed) {
                    const elapsed = Date.now() - new Date(lastUsed).getTime();
                    if (elapsed < cooldownMs) {
                        const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
                        return interaction.reply({ content: `⏳ يجب الانتظار **${remaining} ثانية** قبل تنفيذ هذه الوظيفة مجدداً.`, flags: 64 });
                    }
                }

                function weightedRandom(items, weights) {
                    const total = weights.reduce((a, b) => a + b, 0);
                    let r = Math.random() * total;
                    for (let i = 0; i < items.length; i++) {
                        r -= weights[i];
                        if (r <= 0) return items[i];
                    }
                    return items[items.length - 1];
                }

                const qty      = Math.floor(Math.random() * 10) + 1;
                const obtained = weightedRandom(job.items, job.weights);
                const prices   = await db.getJobPrices();
                const unitPrice = prices[obtained] || 0;
                const estValue  = unitPrice * qty;

                await db.addItem(interaction.user.id, obtained, qty);
                await db.setJobCooldown(interaction.user.id, jobKey);

                const embed = new EmbedBuilder()
                    .setTitle(`${job.label} — النتيجة`)
                    .setColor(job.color)
                    .setDescription(`حصلت على **${qty} ${obtained}** 🎉`)
                    .addFields(
                        { name: '📦 الغنيمة',          value: `${qty}× ${obtained}`,                  inline: true },
                        { name: '💹 سعر الوحدة',        value: `${unitPrice.toLocaleString()} ريال`,  inline: true },
                        { name: '💰 القيمة التقديرية',  value: `${estValue.toLocaleString()} ريال`,   inline: true },
                        { name: '🎒 تُضاف إلى',         value: 'حقيبتك',                             inline: true },
                        { name: '⏳ الكولداون',          value: `10 ثوان`,                             inline: true },
                    )
                    .setFooter({ text: 'نظام الوظائف • بوت FANTASY — بيع مكاسبك عبر قائمة الوظائف' })
                    .setTimestamp();

                const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetBtn)], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId.startsWith('buy_bm_')) {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const itemId = parseInt(interaction.customId.replace('buy_bm_', ''));
                const item   = await db.getBlackMarketItemById(itemId);
                if (!item) return interaction.reply({ content: '❌ هذا الغرض لم يعد متاحاً.', flags: 64 });

                const identity = await db.getActiveIdentity(interaction.user.id);
                if (!identity) return interaction.reply({ content: '❌ يجب تسجيل الدخول أولاً.', flags: 64 });

                const cash = Number(identity.cash);
                if (cash < item.price) return interaction.reply({ content: `❌ كاشك غير كافٍ. تحتاج **${Number(item.price).toLocaleString('en-US')}$** ولديك **${cash.toLocaleString('en-US')}$**.`, flags: 64 });

                await db.addToCash(interaction.user.id, identity.slot, -item.price);
                await db.addItem(interaction.user.id, item.name, 1);

                const embed = new EmbedBuilder()
                    .setTitle('✅ تمت عملية الشراء')
                    .setColor(0x1a1a2e)
                    .setDescription(`تم شراء **${item.name}** بنجاح وأضيف لحقيبتك.`)
                    .addFields(
                        { name: '🛒 الغرض',        value: item.name,                                                    inline: true },
                        { name: '💸 المبلغ المدفوع', value: `${Number(item.price).toLocaleString('en-US')}$`,           inline: true },
                        { name: '💰 رصيدك المتبقي',  value: `${(cash - item.price).toLocaleString('en-US')}$`,          inline: true },
                    )
                    .setFooter({ text: 'البلاك ماركت • بوت FANTASY' })
                    .setTimestamp();

                const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetBtn)], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId.startsWith('buy_market_')) {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const itemId   = parseInt(interaction.customId.replace('buy_market_', ''));
                const item     = await db.getMarketItemById(itemId);
                if (!item) return interaction.reply({ content: '❌ هذا الغرض لم يعد متاحاً.', flags: 64 });

                const identity = await db.getActiveIdentity(interaction.user.id);
                if (!identity) return interaction.reply({ content: '❌ يجب تسجيل الدخول أولاً.', flags: 64 });

                const cash = Number(identity.cash);
                if (cash < item.price)
                    return interaction.reply({ content: `❌ كاشك غير كافٍ. تحتاج **${Number(item.price).toLocaleString()} ريال** ولديك **${cash.toLocaleString()} ريال**.`, flags: 64 });

                await db.addToCash(interaction.user.id, identity.slot, -item.price);
                await db.addItem(interaction.user.id, item.name, 1);

                const embed = new EmbedBuilder()
                    .setTitle('✅ تمت عملية الشراء')
                    .setColor(0xBF360C)
                    .setDescription(`تم شراء **${item.name}** بنجاح وأضيف لحقيبتك.`)
                    .addFields(
                        { name: '🛒 الغرض',          value: item.name,                                         inline: true },
                        { name: '💸 المبلغ المدفوع',  value: `${Number(item.price).toLocaleString()} ريال`,    inline: true },
                        { name: '💵 الكاش المتبقي',   value: `${(cash - item.price).toLocaleString()} ريال`,   inline: true },
                    )
                    .setFooter({ text: 'نظام المتجر • بوت FANTASY' })
                    .setTimestamp();

                const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetBtn)], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId.startsWith('buy_equipment_')) {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const itemId   = parseInt(interaction.customId.replace('buy_equipment_', ''));
                const item     = await db.getEquipmentItemById(itemId);
                if (!item) return interaction.reply({ content: '❌ هذه المعدة لم تعد متاحة.', flags: 64 });

                const identity = await db.getActiveIdentity(interaction.user.id);
                if (!identity) return interaction.reply({ content: '❌ يجب تسجيل الدخول أولاً.', flags: 64 });

                const cash = Number(identity.cash);
                if (cash < item.price)
                    return interaction.reply({ content: `❌ كاشك غير كافٍ. تحتاج **${Number(item.price).toLocaleString()} ريال** ولديك **${cash.toLocaleString()} ريال**.`, flags: 64 });

                await db.addToCash(interaction.user.id, identity.slot, -item.price);
                await db.addItem(interaction.user.id, item.name, 1);

                const embed = new EmbedBuilder()
                    .setTitle('✅ تمت عملية الشراء')
                    .setColor(0x4527A0)
                    .setDescription(`تم شراء **${item.name}** بنجاح وأضيف لحقيبتك.`)
                    .addFields(
                        { name: '🔨 المعدة',          value: item.name,                                         inline: true },
                        { name: '💸 المبلغ المدفوع',  value: `${Number(item.price).toLocaleString()} ريال`,    inline: true },
                        { name: '💵 الكاش المتبقي',   value: `${(cash - item.price).toLocaleString()} ريال`,   inline: true },
                    )
                    .setFooter({ text: 'متجر المعدات • بوت FANTASY' })
                    .setTimestamp();

                const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetBtn)], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId.startsWith('buy_property_')) {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const propId = parseInt(interaction.customId.replace('buy_property_', ''));
                const prop   = await db.getPropertyById(propId);
                if (!prop) return interaction.reply({ content: '❌ هذا العقار لم يعد متاحاً.', flags: 64 });

                const identity = await db.getActiveIdentity(interaction.user.id);
                if (!identity) return interaction.reply({ content: '❌ لم يتم العثور على هويتك النشطة.', flags: 64 });

                const price = Number(prop.price);
                if (Number(identity.cash) < price) {
                    return interaction.reply({
                        content: `❌ كاشك غير كافٍ. لديك \`${Number(identity.cash).toLocaleString()} ريال\` وسعر العقار \`${price.toLocaleString()} ريال\`.`,
                        flags: 64
                    });
                }

                // deduct from cash
                await db.addToCash(interaction.user.id, identity.slot, -price);

                // DM the buyer with property details
                const dmEmbed = new EmbedBuilder()
                    .setTitle(`🏠 تم شراء عقار — ${prop.name}`)
                    .setColor(0x2E7D32)
                    .addFields(
                        { name: '🏠 اسم العقار', value: prop.name, inline: true },
                        { name: '💰 السعر المدفوع', value: `\`${price.toLocaleString()} ريال\``, inline: true },
                    )
                    .setDescription('> تهانينا! تم شراء عقارك بنجاح. احتفظ بهذه الرسالة كوثيقة ملكية.')
                    .setFooter({ text: 'نظام العقارات • بوت FANTASY' })
                    .setTimestamp();
                if (prop.image_url) dmEmbed.setImage(prop.image_url);

                try {
                    const user = await client.users.fetch(interaction.user.id);
                    await user.send({ embeds: [dmEmbed] });
                } catch {
                    // DMs disabled — ignore
                }

                const successEmbed = new EmbedBuilder()
                    .setTitle('✅ تمت عملية الشراء')
                    .setColor(0x2E7D32)
                    .addFields(
                        { name: '🏠 العقار', value: prop.name, inline: true },
                        { name: '💰 المبلغ المدفوع', value: `\`${price.toLocaleString()} ريال\``, inline: true },
                    )
                    .setDescription('> تم خصم المبلغ من كاشك وإرسال وثيقة الملكية في خاصك.')
                    .setFooter({ text: 'نظام العقارات • بوت FANTASY' })
                    .setTimestamp();
                return interaction.update({ embeds: [successEmbed], components: [] });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ أثناء عملية الشراء.', flags: 64 });
            }
        }

        if (interaction.customId === 'confirm_delete_all_identities' || interaction.customId === 'cancel_delete_all_identities') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ هذا الأمر للمسؤولين فقط.', flags: 64 });
            }
            if (interaction.customId === 'cancel_delete_all_identities') {
                return interaction.update({ content: '❌ تم إلغاء العملية.', embeds: [], components: [] });
            }
            try {
                await db.deleteAllIdentities();
                const doneEmbed = new EmbedBuilder()
                    .setTitle('🗑️ تم حذف جميع الهويات')
                    .setColor(0x757575)
                    .setDescription('> تم حذف جميع الهويات والطلبات المعلقة بنجاح، وتم تسجيل الخروج من جميع الحسابات.')
                    .setFooter({ text: 'بوت FANTASY • نظام الهويات' })
                    .setTimestamp();
                return interaction.update({ embeds: [doneEmbed], components: [] });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ أثناء حذف الهويات.', flags: 64 });
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

                    // منح رتبة الهوية تلقائياً
                    try {
                        const identityRoleId = await db.getConfig('identity_role');
                        if (identityRoleId) {
                            const member = await interaction.guild.members.fetch(pending.discord_id);
                            await member.roles.add(identityRoleId);
                        }
                    } catch {}

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

        // ── تفعيل / رفض طلب التفعيل ───────────────────────────────────────────
        if (interaction.customId.startsWith('activate_approve_') || interaction.customId.startsWith('activate_reject_')) {
            const isApprove = interaction.customId.startsWith('activate_approve_');
            const reqId = parseInt(interaction.customId.replace(isApprove ? 'activate_approve_' : 'activate_reject_', ''));
            try {
                const { isAdmin } = require('./utils');
                if (!(await isAdmin(interaction.member, db)))
                    return interaction.reply({ content: '❌ للإدارة فقط.', flags: 64 });

                const req = await db.getActivationRequest(reqId);
                if (!req) return interaction.update({ content: '❌ الطلب غير موجود أو تمت معالجته.', embeds: [], components: [] });

                if (isApprove) {
                    // منح رتبة التفعيل
                    try {
                        const roleId = await db.getConfig('activation_role_id');
                        if (roleId) {
                            const member = await interaction.guild.members.fetch(req.user_id).catch(() => null);
                            if (member) await member.roles.add(roleId).catch(() => {});
                        }
                    } catch (_) {}

                    const approveEmbed = new EmbedBuilder()
                        .setTitle('✅ تم قبول طلب التفعيل')
                        .setColor(0x2E7D32)
                        .addFields(
                            { name: '👤 اللاعب',       value: `<@${req.user_id}>`,  inline: true },
                            { name: '🎮 ID سوني',       value: `\`${req.sony_id}\``, inline: true },
                            { name: '✅ قبله',           value: `<@${interaction.user.id}>`, inline: true },
                        )
                        .setFooter({ text: 'نظام التفعيل • بوت FANTASY' }).setTimestamp();

                    await interaction.update({ embeds: [approveEmbed], components: [] });

                    try {
                        const user = await client.users.fetch(req.user_id);
                        await user.send(
                            `✅ **تم قبول طلب تفعيلك في سيرفر ${interaction.guild.name}!**\n` +
                            `> 🎮 **ID سوني:** \`${req.sony_id}\`\n` +
                            `> يمكنك الآن الوصول إلى السيرفر بشكل كامل.`
                        );
                    } catch (_) {}

                } else {
                    const rejectEmbed = new EmbedBuilder()
                        .setTitle('❌ تم رفض طلب التفعيل')
                        .setColor(0xB71C1C)
                        .addFields(
                            { name: '👤 اللاعب',  value: `<@${req.user_id}>`,         inline: true },
                            { name: '🎮 ID سوني', value: `\`${req.sony_id}\``,         inline: true },
                            { name: '❌ رفضه',    value: `<@${interaction.user.id}>`,  inline: true },
                        )
                        .setFooter({ text: 'نظام التفعيل • بوت FANTASY' }).setTimestamp();

                    await interaction.update({ embeds: [rejectEmbed], components: [] });

                    try {
                        const user = await client.users.fetch(req.user_id);
                        await user.send(
                            `❌ **تم رفض طلب تفعيلك في سيرفر ${interaction.guild.name}.**\n` +
                            `> تواصل مع الإدارة لمعرفة السبب أو إعادة المحاولة.`
                        );
                    } catch (_) {}
                }

                await db.deleteActivationRequest(reqId);
            } catch (e) {
                console.error(e);
                if (!interaction.replied && !interaction.deferred)
                    interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
            }
            return;
        }

        if (['bank_balance','bank_deposit','bank_withdraw','bank_transfer'].includes(interaction.customId)) {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const loginErr = await db.checkLoginAndIdentity(interaction.user.id);
                if (loginErr) return interaction.reply({ content: loginErr, flags: 64 });
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
            { const _e = await db.checkLoginAndIdentity(interaction.user.id); if (_e) return interaction.reply({ content: _e, flags: 64 }); }

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
            { const _e = await db.checkLoginAndIdentity(interaction.user.id); if (_e) return interaction.reply({ content: _e, flags: 64 }); }

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
            { const _e = await db.checkLoginAndIdentity(interaction.user.id); if (_e) return interaction.reply({ content: _e, flags: 64 }); }

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

        // ── قبول/رفض طلب التوكيل (أزرار لوحة المحامي) ───────────────────────
        if (interaction.customId.startsWith('lawyer_req_accept_') || interaction.customId.startsWith('lawyer_req_reject_')) {
            try {
                const isAccept = interaction.customId.startsWith('lawyer_req_accept_');
                const reqId    = parseInt((isAccept
                    ? interaction.customId.replace('lawyer_req_accept_', '')
                    : interaction.customId.replace('lawyer_req_reject_', '')));
                const req = await db.getLawyerRequestById(reqId);
                if (!req) return interaction.reply({ content: '❌ الطلب غير موجود أو انتهت صلاحيته.', flags: 64 });
                if (req.lawyer_id !== interaction.user.id) return interaction.reply({ content: '❌ هذا الطلب ليس موجهاً لك.', flags: 64 });
                if (req.status !== 'pending') return interaction.reply({ content: '❌ تم البت في هذا الطلب مسبقاً.', flags: 64 });

                await db.updateLawyerRequest(reqId, isAccept ? 'accepted' : 'rejected');
                const allLawyers = await db.getLawyers();
                const lawyer = allLawyers.find(l => l.discord_id === interaction.user.id);

                let feeResult = null;
                if (isAccept) {
                    await db.assignLawyer(req.case_id, interaction.user.id, lawyer?.lawyer_name || interaction.user.username);
                    // خصم بدل التوكيل الثابت 5000 تلقائياً
                    const { RETAINER_FEE } = require('./commands/lawyer-tasks');
                    feeResult = await db.chargeLawyerFee(
                        req.plaintiff_id,
                        interaction.user.id,
                        RETAINER_FEE,
                        `بدل توكيل — قضية ${req.case_number}`
                    );

                    // ✉️ إرسال تفاصيل الموكّل والقضية للمحامي في الخاص
                    try {
                        const fullCase = await db.getCaseById(req.case_id);
                        const lawyerUser = await interaction.client.users.fetch(interaction.user.id);
                        const caseEmbed = new EmbedBuilder()
                            .setTitle('📂 تفاصيل القضية الجديدة')
                            .setColor(0x0D47A1)
                            .setDescription('لقد قبلت هذا التوكيل. فيما يلي تفاصيل الموكّل والقضية:')
                            .addFields(
                                { name: '🔢 رقم القضية', value: fullCase?.case_number || req.case_number, inline: true },
                                { name: '📌 عنوان القضية', value: fullCase?.title || req.case_title, inline: true },
                                { name: '👤 اسم الموكّل', value: req.plaintiff_name, inline: true },
                                { name: '🪪 معرّف الموكّل', value: `<@${req.plaintiff_id}>`, inline: true },
                                { name: '🎯 المدّعى عليه', value: fullCase?.defendant || '—', inline: true },
                                { name: '📋 وصف القضية', value: fullCase?.description || '—', inline: false },
                                { name: '🗂️ الأدلة', value: fullCase?.evidence || '—', inline: false },
                            )
                            .setFooter({ text: 'نظام المحاماة • بوت FANTASY' })
                            .setTimestamp();
                        await lawyerUser.send({ embeds: [caseEmbed] });
                    } catch (_) {}
                }

                // إشعار الموكّل
                try {
                    const { RETAINER_FEE } = require('./commands/lawyer-tasks');
                    const plaintiffUser = await interaction.client.users.fetch(req.plaintiff_id);
                    const dmFields = [
                        { name: '🔢 رقم القضية', value: req.case_number,              inline: true },
                        { name: '📌 العنوان',     value: req.case_title,               inline: true },
                        { name: '👨‍⚖️ المحامي',   value: lawyer?.lawyer_name || '—', inline: true },
                    ];
                    if (isAccept) {
                        dmFields.push({
                            name: '💰 بدل التوكيل',
                            value: feeResult?.success
                                ? `✅ تم خصم **${RETAINER_FEE.toLocaleString()} ريال** من حسابك`
                                : `⚠️ ${feeResult?.error || 'تعذّر خصم بدل التوكيل'}`,
                            inline: false,
                        });
                    }
                    const dmEmbed = new EmbedBuilder()
                        .setTitle(isAccept ? '✅ تم قبول طلب التوكيل' : '❌ تم رفض طلب التوكيل')
                        .setColor(isAccept ? 0x1B5E20 : 0xB71C1C)
                        .addFields(...dmFields)
                        .setFooter({ text: 'نظام المحاماة • بوت FANTASY' }).setTimestamp();
                    await plaintiffUser.send({ embeds: [dmEmbed] });
                } catch (_) {}

                // تحديث اللوحة
                const { buildTasks } = require('./commands/lawyer-tasks');
                const newDash = await buildTasks(db, interaction.user.id, lawyer?.lawyer_name || interaction.user.username);
                return interaction.update(newDash);
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        // ── طلب أتعاب إضافية 10,000 ───────────────────────────────────────────
        if (interaction.customId.startsWith('lawyer_atab_')) {
            try {
                const caseId = Number(interaction.customId.replace('lawyer_atab_', ''));
                const c = await db.getCaseById(caseId);
                if (!c) return interaction.reply({ content: '❌ القضية غير موجودة.', flags: 64 });
                if (c.lawyer_id !== interaction.user.id)
                    return interaction.reply({ content: '❌ أنت لست محامي هذه القضية.', flags: 64 });

                // ✅ شرط 15 يوم
                const DAYS_REQUIRED = 15;
                const assignedAt = c.lawyer_assigned_at ? new Date(c.lawyer_assigned_at).getTime() : null;
                const daysPassed  = assignedAt ? Math.floor((Date.now() - assignedAt) / 86_400_000) : 0;
                if (daysPassed < DAYS_REQUIRED)
                    return interaction.reply({ content: `⏳ لم يحن وقت المطالبة بالأتعاب بعد — يتبقى **${DAYS_REQUIRED - daysPassed} يوم**.`, flags: 64 });

                const { ATAB_FEE } = require('./commands/lawyer-tasks');
                const result = await db.chargeLawyerFee(
                    c.plaintiff_id,
                    interaction.user.id,
                    ATAB_FEE,
                    `أتعاب محاماة — قضية ${c.case_number}`
                );

                if (!result.success)
                    return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });

                // إشعار الموكّل بالأتعاب
                try {
                    const plaintiffUser = await interaction.client.users.fetch(c.plaintiff_id);
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('💼 تم خصم أتعاب المحاماة')
                        .setColor(0xE65100)
                        .addFields(
                            { name: '🔢 رقم القضية', value: c.case_number,              inline: true },
                            { name: '📌 العنوان',     value: c.title,                   inline: true },
                            { name: '👨‍⚖️ المحامي',   value: c.lawyer_name || '—',     inline: true },
                            { name: '💰 المبلغ المخصوم', value: `**${ATAB_FEE.toLocaleString()} ريال**`, inline: false },
                        )
                        .setFooter({ text: 'نظام المحاماة • بوت FANTASY' }).setTimestamp();
                    await plaintiffUser.send({ embeds: [dmEmbed] });
                } catch (_) {}

                // تحديث اللوحة
                const allLawyers = await db.getLawyers();
                const lawyerData = allLawyers.find(l => l.discord_id === interaction.user.id);
                const { buildTasks } = require('./commands/lawyer-tasks');
                const newDash = await buildTasks(db, interaction.user.id, lawyerData?.lawyer_name || interaction.user.username);
                return interaction.update(newDash);
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        // ── التخلي عن قضية (فتح modal) ───────────────────────────────────────
        if (interaction.customId.startsWith('lawyer_abandon_')) {
            try {
                const caseId = Number(interaction.customId.replace('lawyer_abandon_', ''));
                const c = await db.getCaseById(caseId);
                if (!c) return interaction.reply({ content: '❌ القضية غير موجودة.', flags: 64 });
                if (c.lawyer_id !== interaction.user.id)
                    return interaction.reply({ content: '❌ أنت لست محامي هذه القضية.', flags: 64 });

                const { ABANDON_FEE } = require('./commands/lawyer-tasks');
                const modal = new ModalBuilder()
                    .setCustomId(`lawyer_abandon_modal_${caseId}`)
                    .setTitle(`🚫 التخلي عن القضية — ${c.case_number}`);
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('abandon_reason')
                            .setLabel(`سبب التخلي عن التوكيل`)
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder(`سيُرفع هذا السبب للموكّل • سيُخصم ${ABANDON_FEE.toLocaleString()} ريال من رصيدك`)
                            .setRequired(true)
                            .setMinLength(10)
                    )
                );
                return interaction.showModal(modal);
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        // ── تجميع الموارد ──────────────────────────────────────────────────────────
        if (interaction.customId === 'gather_resources') {
            try {
                await interaction.deferUpdate();
                const RESOURCES = [
                    { name: 'ألمنيوم', emoji: '🔩' },
                    { name: 'حديد',    emoji: '⚙️' },
                    { name: 'خشب',     emoji: '🪵' },
                    { name: 'أربطة',   emoji: '🪢' },
                    { name: 'مسامير',  emoji: '📌' },
                ];
                const last      = await db.getLastGathered(interaction.user.id);
                const available = last ? RESOURCES.filter(r => r.name !== last) : RESOURCES;
                const picked    = available[Math.floor(Math.random() * available.length)];
                const amount    = Math.floor(Math.random() * 19) + 2;

                await db.setLastGathered(interaction.user.id, picked.name);
                await db.addItem(interaction.user.id, picked.name, amount);

                const displayName = interaction.member?.displayName || interaction.user.username;
                await interaction.channel.send(
                    `🪛 **${displayName}** جمّع **${amount}x ${picked.emoji} ${picked.name}** وأضافها إلى حقيبته!`
                );
            } catch (e) { console.error(e); }
            return;
        }

        return;
    }

    if (interaction.isStringSelectMenu()) {
        const value = interaction.values[0];

        // ── منيو التفعيل ────────────────────────────────────────────────────────
        if (interaction.customId === 'activation_menu' && value === 'activate_now') {
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder: ARB } = require('discord.js');
            const modal = new ModalBuilder()
                .setCustomId('activation_sony_modal')
                .setTitle('🎮 طلب تفعيل الحساب');
            modal.addComponents(
                new ARB().addComponents(
                    new TextInputBuilder()
                        .setCustomId('sony_id')
                        .setLabel('ادخل ID سوني الخاص بك (PSN)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('مثال: PlayerName123')
                        .setRequired(true)
                        .setMinLength(3)
                        .setMaxLength(50)
                )
            );
            return interaction.showModal(modal);
        }

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

        if (interaction.customId === 'black_market_menu') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const itemId = parseInt(value);
                const item   = await db.getBlackMarketItemById(itemId);
                if (!item) return interaction.reply({ content: '❌ هذا الغرض لم يعد متاحاً.', flags: 64 });

                const embed = new EmbedBuilder()
                    .setTitle(`🖤 ${item.name}`)
                    .setColor(0x1a1a2e)
                    .addFields(
                        { name: '💰 السعر', value: `**${Number(item.price).toLocaleString('en-US')}$**`, inline: true },
                    )
                    .setFooter({ text: 'البلاك ماركت • بوت FANTASY' })
                    .setTimestamp();

                const buyBtn = new ButtonBuilder()
                    .setCustomId(`buy_bm_${item.id}`)
                    .setLabel(`🛒 شراء ${item.name}`)
                    .setStyle(ButtonStyle.Danger);
                const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                const row = new ActionRowBuilder().addComponents(buyBtn, resetBtn);
                return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'market_item_select') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const itemId = parseInt(value);
                const item   = await db.getMarketItemById(itemId);
                if (!item) return interaction.reply({ content: '❌ هذا الغرض لم يعد متاحاً.', flags: 64 });

                const identity = await db.getActiveIdentity(interaction.user.id);
                const cash     = Number(identity?.cash || 0);

                const embed = new EmbedBuilder()
                    .setTitle(`🛒 ${item.name}`)
                    .setColor(0xBF360C)
                    .addFields(
                        { name: '💰 السعر',      value: `**${Number(item.price).toLocaleString()} ريال**`, inline: true },
                        { name: '💵 كاشك الحالي', value: `${cash.toLocaleString()} ريال`,                  inline: true },
                    )
                    .setFooter({ text: 'نظام المتجر • بوت FANTASY' })
                    .setTimestamp();

                if (item.description) embed.setDescription(`> ${item.description}`);

                if (cash < item.price) {
                    embed.addFields({ name: '❌ رصيد غير كافٍ', value: `تحتاج ${(item.price - cash).toLocaleString()} ريال إضافية`, inline: false });
                    const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                    return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetBtn)], flags: 64 });
                }

                const buyBtn   = new ButtonBuilder().setCustomId(`buy_market_${item.id}`).setLabel(`✅ تأكيد الشراء`).setStyle(ButtonStyle.Success);
                const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(buyBtn, resetBtn)], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'equipment_item_select') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const itemId   = parseInt(value);
                const item     = await db.getEquipmentItemById(itemId);
                if (!item) return interaction.reply({ content: '❌ هذه المعدة لم تعد متاحة.', flags: 64 });

                const identity = await db.getActiveIdentity(interaction.user.id);
                const cash     = Number(identity?.cash || 0);

                const embed = new EmbedBuilder()
                    .setTitle(`🔨 ${item.name}`)
                    .setColor(0x4527A0)
                    .addFields(
                        { name: '💰 السعر',       value: `**${Number(item.price).toLocaleString()} ريال**`, inline: true },
                        { name: '💵 كاشك الحالي', value: `${cash.toLocaleString()} ريال`,                  inline: true },
                    )
                    .setFooter({ text: 'متجر المعدات • بوت FANTASY' })
                    .setTimestamp();

                if (item.description) embed.setDescription(`> ${item.description}`);

                if (cash < item.price) {
                    embed.addFields({ name: '❌ رصيد غير كافٍ', value: `تحتاج ${(item.price - cash).toLocaleString()} ريال إضافية`, inline: false });
                    return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary))], flags: 64 });
                }

                const buyBtn   = new ButtonBuilder().setCustomId(`buy_equipment_${item.id}`).setLabel('✅ تأكيد الشراء').setStyle(ButtonStyle.Success);
                const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(buyBtn, resetBtn)], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
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
                    return interaction.reply({ embeds: [embedOut], flags: 64 });
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
                const identities = await db.getUserIdentities(interaction.user.id);
                const char = identities.find(i => i.slot === slot);
                if (!char || !char.character_name) return interaction.reply({ content: '❌ هذه الشخصية غير مقبولة أو غير مكتملة. لا يمكن تسجيل الدخول بها.', flags: 64 });
                await db.loginIdentity(interaction.user.id, slot);
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
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ أثناء تسجيل الدخول.', flags: 64 });
            }
        }

        if (interaction.customId === 'properties_menu') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const propId = parseInt(value);
                const prop = await db.getPropertyById(propId);
                if (!prop) return interaction.reply({ content: '❌ هذا العقار لم يعد متاحاً.', flags: 64 });

                const embed = new EmbedBuilder()
                    .setTitle(`🏠 ${prop.name}`)
                    .setColor(0xB71C1C)
                    .addFields(
                        { name: '💰 السعر', value: `\`${Number(prop.price).toLocaleString()} ريال\``, inline: true },
                    )
                    .setDescription('هل تريد شراء هذا العقار؟ اضغط على زر الشراء أدناه.\n> سيتم خصم المبلغ من كاشك وإرسال تفاصيل العقار في خاصك.')
                    .setFooter({ text: 'نظام العقارات • بوت FANTASY' })
                    .setTimestamp();
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`buy_property_${prop.id}`)
                        .setLabel(`شراء ${prop.name}`)
                        .setStyle(ButtonStyle.Danger),
                );
                return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'robbery_menu') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const robberyId = parseInt(value);
                const rob = await db.getRobberyById(robberyId);
                if (!rob) return interaction.reply({ content: '❌ هذه السرقة لم تعد متاحة.', flags: 64 });

                const toolsList = rob.tools.trim().toLowerCase() === 'لا يوجد' || !rob.tools.trim()
                    ? null
                    : rob.tools.split(',').map(t => t.trim()).filter(Boolean);

                // check inventory
                const inventory = await db.getInventory(interaction.user.id);
                const missing = [];
                if (toolsList) {
                    for (const tool of toolsList) {
                        const has = inventory.find(i => i.item_name.trim().toLowerCase() === tool.toLowerCase() && i.quantity > 0);
                        if (!has) missing.push(tool);
                    }
                }

                if (missing.length) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ أدوات ناقصة')
                        .setColor(0xB71C1C)
                        .setDescription(`لا تملك الأدوات اللازمة لتنفيذ **${rob.name}**:`)
                        .addFields({ name: '🛠️ الأدوات الناقصة', value: missing.map(t => `• \`${t}\``).join('\n'), inline: false })
                        .setFooter({ text: 'نظام السرقات • بوت FANTASY' })
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }

                // execute robbery
                const amount = Math.floor(Math.random() * (rob.max_money - rob.min_money + 1)) + rob.min_money;

                // consume tools
                if (toolsList) {
                    for (const tool of toolsList) {
                        await db.useItem(interaction.user.id, tool).catch(() => {});
                    }
                }

                // add money to cash
                const identity = await db.getActiveIdentity(interaction.user.id);
                if (identity) {
                    await db.addToCash(interaction.user.id, identity.slot, amount);
                }

                const embed = new EmbedBuilder()
                    .setTitle('💰 تمت السرقة بنجاح!')
                    .setColor(0x2E7D32)
                    .addFields(
                        { name: '🔫 نوع السرقة', value: rob.name, inline: true },
                        { name: '💵 المبلغ المسروق', value: `\`${amount.toLocaleString()} ريال\``, inline: true },
                        { name: '🛠️ الأدوات المستخدمة', value: toolsList ? toolsList.map(t => `\`${t}\``).join(', ') : '`لا يوجد`', inline: false },
                    )
                    .setFooter({ text: 'نظام السرقات • بوت FANTASY' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed] , flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ أثناء تنفيذ السرقة.', flags: 64 });
            }
        }

        if (interaction.customId === 'snap_menu') {
            try {
                const { ModalBuilder: MN, TextInputBuilder: TIN, TextInputStyle: TSN, ActionRowBuilder: ARN, StringSelectMenuBuilder: SSN } = require('discord.js');
                await db.ensureUser(interaction.user.id, interaction.user.username);
                { const _e = await db.checkLoginAndIdentity(interaction.user.id); if (_e) return interaction.reply({ content: _e, flags: 64 }); }
                const acc = await db.getSnapAccount(interaction.user.id);
                if (!acc) return interaction.reply({ content: '❌ ليس لديك حساب سناب.', flags: 64 });

                if (value === 'snap_send') {
                    const friends = await db.getSnapFriends(interaction.user.id);
                    if (!friends.length) return interaction.reply({ content: '❌ ليس لديك أصدقاء بعد. أضف صديقاً أولاً.', flags: 64 });
                    const options = friends.slice(0, 25).map(f => ({
                        label: f.friend_username,
                        value: f.friend_id,
                        description: `🔥 ستريك: ${f.streak}`,
                    }));
                    const row = new ARN().addComponents(
                        new SSN().setCustomId('snap_friend_select').setPlaceholder('👻 اختر صديق لإرسال سناب').addOptions(options)
                    );
                    return interaction.reply({ content: '📸 **اختر الصديق الذي تريد إرسال سناب له:**', components: [row], flags: 64 });
                }

                if (value === 'snap_inbox') {
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
                        msgs.slice(0, 10).forEach(m => embed.addFields({
                            name: `${m.seen ? '📖' : '🔴'} من: **${m.sender_username}**`,
                            value: `> ${m.content}\n⏰ ${new Date(m.created_at).toLocaleString('ar-SA')}`,
                            inline: false,
                        }));
                        for (const m of msgs.filter(m => !m.seen)) await db.markSnapSeen(m.id, interaction.user.id);
                    }
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }

                if (value === 'snap_friends') {
                    const friends = await db.getSnapFriends(interaction.user.id);
                    const embed = new EmbedBuilder()
                        .setTitle('👥 أصدقائي على سناب')
                        .setColor(0xFFFC00)
                        .setFooter({ text: `${friends.length} صديق • سناب شات • بوت FANTASY` })
                        .setTimestamp();
                    if (!friends.length) {
                        embed.setDescription('> لا يوجد أصدقاء بعد. اختر **➕ إضافة صديق**');
                        return interaction.reply({ embeds: [embed], flags: 64 });
                    }
                    const SPACER = { name: '\u200b', value: '\u200b', inline: true };
                    const fields = friends.map(f => {
                        const s = f.streak;
                        const badge = s >= 100 ? '💯' : s >= 50 ? '🏆' : s >= 10 ? '⚡' : '🔥';
                        return { name: `👻 ${f.friend_username}`, value: `${badge} **${s}** ستريك`, inline: true };
                    });
                    while (fields.length % 3 !== 0) fields.push(SPACER);
                    embed.addFields(fields);
                    const msgRow = new ARN().addComponents(
                        new SSN().setCustomId('snap_friend_select')
                            .setPlaceholder('💬 اختر صديق لمراسلته')
                            .addOptions(friends.slice(0, 25).map(f => ({
                                label: f.friend_username,
                                value: f.friend_id,
                                description: `🔥 ستريك: ${f.streak}`,
                            })))
                    );
                    return interaction.reply({ embeds: [embed], components: [msgRow], flags: 64 });
                }

                if (value === 'snap_add') {
                    const modal = new MN().setCustomId('snap_add_modal').setTitle('➕ إضافة صديق')
                        .addComponents(new ARN().addComponents(
                            new TIN().setCustomId('friend_snap_name').setLabel('اسم حساب سناب الصديق')
                                .setStyle(TSN.Short).setRequired(true).setMaxLength(20)
                                .setPlaceholder('مثال: Sultan2025')
                        ));
                    return interaction.showModal(modal);
                }

                if (value === 'snap_requests') {
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
                    const row = new ARN().addComponents(
                        new SSN().setCustomId('snap_accept_select').setPlaceholder('✅ اختر طلباً لقبوله').addOptions(options)
                    );
                    return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
                }
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'snap_friend_select') {
            try {
                const friendId  = value;
                const myAcc     = await db.getSnapAccount(interaction.user.id);
                const friendAcc = await db.getSnapAccount(friendId);
                if (!friendAcc) return interaction.reply({ content: '❌ لم يُعثر على حساب الصديق.', flags: 64 });

                const msgs = await db.getSnapConversation(interaction.user.id, friendId);

                const embed = new EmbedBuilder()
                    .setTitle(`💬 محادثتك مع @${friendAcc.snap_username}`)
                    .setColor(0xFFFC00)
                    .setFooter({ text: 'سناب شات • بوت FANTASY' })
                    .setTimestamp();

                if (!msgs.length) {
                    embed.setDescription('> لا توجد رسائل بعد. ابدأ المحادثة الآن!');
                } else {
                    embed.setDescription(
                        msgs.map(m => {
                            const isMe = m.sender_id === interaction.user.id;
                            const time = new Date(m.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
                            return `${isMe ? '📤 **أنت**' : `📥 **@${m.sender_username}**`} — ${time}\n> ${m.content}`;
                        }).join('\n\n')
                    );
                }

                const sendBtn  = new ButtonBuilder().setCustomId(`snap_msg_btn_${friendId}`).setLabel('📸 إرسال رسالة').setStyle(ButtonStyle.Primary);
                const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                const row = new ActionRowBuilder().addComponents(sendBtn, resetBtn);
                return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId.startsWith('snap_msg_btn_')) {
            try {
                const friendId  = interaction.customId.replace('snap_msg_btn_', '');
                const friendAcc = await db.getSnapAccount(friendId);
                const modal = new ModalBuilder()
                    .setCustomId(`snap_send_modal_${friendId}`)
                    .setTitle(`📸 رسالة لـ @${friendAcc?.snap_username || 'صديق'}`)
                    .addComponents(new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('snap_content').setLabel('نص الرسالة')
                            .setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(300)
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


        // ── أزرار منصة X (إعجاب / رتويت / رد) ─────────────────────────────────
        if (interaction.customId.startsWith('x_like_')) {
            try {
                const postId = parseInt(interaction.customId.replace('x_like_', ''));
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const newLikes = await db.likePost(postId);
                const comps = interaction.message.components.map(row => {
                    const { ActionRowBuilder: ARB2, ButtonBuilder: BB2 } = require('discord.js');
                    const newRow = new ARB2();
                    for (const btn of row.components) {
                        const b = BB2.from(btn.toJSON());
                        if (btn.customId === `x_like_${postId}`) b.setLabel(`❤️ ${newLikes}`);
                        newRow.addComponents(b);
                    }
                    return newRow;
                });
                return interaction.update({ components: comps });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        if (interaction.customId.startsWith('x_retweet_')) {
            try {
                const postId = parseInt(interaction.customId.replace('x_retweet_', ''));
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const myAcc = await db.getXAccount(interaction.user.id);
                if (!myAcc) return interaction.reply({ content: '❌ ليس لديك حساب على منصة X.', flags: 64 });
                const xChannelId = await db.getConfig('x_channel');
                if (!xChannelId) return interaction.reply({ content: '❌ لم يتم تحديد روم التغريدات.', flags: 64 });
                const orig = await db.getPostById(postId);
                if (!orig) return interaction.reply({ content: '❌ التغريدة غير موجودة.', flags: 64 });
                const rt = await db.retweetPost(interaction.user.id, postId);
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `@${myAcc.x_username} 🔁 رتويت`, iconURL: interaction.user.displayAvatarURL() })
                    .setColor(0x1DA1F2)
                    .setDescription(orig.content)
                    .addFields(
                        { name: '↩️ رتويت من', value: `@${orig.x_username}`, inline: true },
                        { name: '🆔 رقم المنشور', value: `\`#${rt.id}\``, inline: true },
                    )
                    .setFooter({ text: 'منصة X • بوت FANTASY' })
                    .setTimestamp();
                const xChannel = interaction.guild?.channels?.cache.get(xChannelId);
                if (xChannel) await xChannel.send({ embeds: [embed] });
                const comps = interaction.message.components.map(row => {
                    const { ActionRowBuilder: ARB3, ButtonBuilder: BB3 } = require('discord.js');
                    const newRow = new ARB3();
                    for (const btn of row.components) {
                        const b = BB3.from(btn.toJSON());
                        if (btn.customId === `x_retweet_${postId}`) b.setLabel(`🔁 ${orig.retweets + 1}`);
                        newRow.addComponents(b);
                    }
                    return newRow;
                });
                await interaction.update({ components: comps });
                return interaction.followUp({ content: `✅ تم الرتويت في <#${xChannelId}>`, flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        if (interaction.customId.startsWith('x_reply_')) {
            try {
                const postId = parseInt(interaction.customId.replace('x_reply_', ''));
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const myAcc = await db.getXAccount(interaction.user.id);
                if (!myAcc) return interaction.reply({ content: '❌ ليس لديك حساب على منصة X.', flags: 64 });
                const { ModalBuilder: MBR, TextInputBuilder: TIBR, TextInputStyle: TISR, ActionRowBuilder: ARBR } = require('discord.js');
                const modal = new MBR().setCustomId(`x_reply_modal_${postId}`).setTitle('💬 الرد على التغريدة')
                    .addComponents(new ARBR().addComponents(
                        new TIBR().setCustomId('reply_content').setLabel('نص ردك')
                            .setStyle(TISR.Paragraph).setRequired(true).setMaxLength(280)
                    ));
                return interaction.showModal(modal);
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }


        // ── المحاماة ──────────────────────────────────────────────────────────
        if (interaction.customId === 'law_menu') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                if (value === 'new_case') {
                    const modal = new ModalBuilder().setCustomId('new_case_modal').setTitle('📁 رفع قضية جديدة');
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('case_title').setLabel('عنوان القضية').setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('case_defendant').setLabel('المدعى عليه').setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('case_desc').setLabel('وصف القضية').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('case_evidence').setLabel('الأدلة (اختياري)').setStyle(TextInputStyle.Paragraph).setRequired(false)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('case_lawyer_fee').setLabel('بدل المحاماة (اختياري)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('مثال: 5000$')),
                    );
                    return interaction.showModal(modal);
                }

                if (value === 'my_cases') {
                    const cases = await db.getCasesByPlaintiff(interaction.user.id);
                    if (!cases.length) return interaction.reply({ content: '📋 لا توجد قضايا مرفوعة باسمك.', flags: 64 });
                    const lines = cases.map(c =>
                        `**[${c.case_number}]** ${c.title}\n> ضد: ${c.defendant} • الحالة: ${db.CASE_STATUS[c.status] || c.status}${c.lawyer_name ? ` • المحامي: ${c.lawyer_name}` : ''}${c.judge_name ? ` • القاضي: ${c.judge_name}` : ''}`
                    ).join('\n\n');
                    const embed = new EmbedBuilder()
                        .setTitle('📋 قضاياي')
                        .setColor(0x0D47A1)
                        .setDescription(lines.slice(0, 4000))
                        .setFooter({ text: `إجمالي القضايا: ${cases.length} • بوت FANTASY` })
                        .setTimestamp();
                    const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                    return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetBtn)], flags: 64 });
                }

                if (value === 'hire_lawyer') {
                    const lawyers = await db.getLawyers();
                    if (!lawyers.length) return interaction.reply({ content: '❌ لا يوجد محامون معتمدون حالياً. تواصل مع الإدارة.', flags: 64 });
                    const cases = await db.getCasesByPlaintiff(interaction.user.id);
                    const eligible = cases.filter(c => ['pending','accepted','in_progress'].includes(c.status));
                    if (!eligible.length) return interaction.reply({ content: '❌ لا توجد قضايا مفتوحة باسمك.', flags: 64 });
                    const sel = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder().setCustomId('case_sel_lawyer').setPlaceholder('📁 أولاً: اختر القضية')
                            .addOptions(eligible.slice(0,25).map(c => ({ label: `${c.case_number} — ${c.title}`, value: String(c.id), description: `الحالة: ${db.CASE_STATUS[c.status]}` })))
                    );
                    const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                    return interaction.reply({ content: '👨‍⚖️ **الخطوة 1:** اختر القضية:', components: [sel, new ActionRowBuilder().addComponents(resetBtn)], flags: 64 });
                }
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        // ── العدل ─────────────────────────────────────────────────────────────
        if (interaction.customId === 'justice_menu') {
            try {
                const { isAdmin } = require('./utils');
                if (!(await isAdmin(interaction.member, db)))
                    return interaction.reply({ content: '❌ للإدارة فقط.', flags: 64 });

                const actionMap = {
                    accept_case:   { statuses: ['pending'],     label: '✅ اختر القضية للقبول',   customId: 'case_sel_accept' },
                    reject_case:   { statuses: ['pending'],     label: '❌ اختر القضية للرفض',    customId: 'case_sel_reject' },
                    assign_judge:  { statuses: ['accepted'],    label: '👨‍⚖️ اختر القضية لتعيين قاضٍ', customId: 'case_sel_judge' },
                    issue_verdict: { statuses: ['in_progress'], label: '📜 اختر القضية لإصدار الحكم', customId: 'case_sel_verdict' },
                };
                const cfg = actionMap[value];
                if (!cfg) return;

                let cases = [];
                for (const st of cfg.statuses) cases.push(...await db.getCasesByStatus(st));
                if (!cases.length) return interaction.reply({ content: '📋 لا توجد قضايا في هذه الحالة.', flags: 64 });

                const sel = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder().setCustomId(cfg.customId).setPlaceholder('اختر القضية')
                        .addOptions(cases.slice(0,25).map(c => ({ label: `${c.case_number} — ${c.title}`, value: String(c.id), description: `ضد: ${c.defendant} • ${db.CASE_STATUS[c.status]}` })))
                );
                const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                return interaction.reply({ content: cfg.label + ':', components: [sel, new ActionRowBuilder().addComponents(resetBtn)], flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        // ── قبول قضية مباشرة ─────────────────────────────────────────────────
        if (interaction.customId === 'case_sel_accept') {
            try {
                const c = await db.getCaseById(Number(value));
                if (!c) return interaction.reply({ content: '❌ القضية غير موجودة.', flags: 64 });
                await db.acceptCase(c.id);
                const embed = new EmbedBuilder()
                    .setTitle('✅ تم قبول القضية')
                    .setColor(0x2E7D32)
                    .addFields(
                        { name: '📁 رقم القضية', value: c.case_number,          inline: true },
                        { name: '📌 العنوان',    value: c.title,                 inline: true },
                        { name: '👤 المدعي',     value: `<@${c.plaintiff_id}>`, inline: true },
                        { name: '⚔️ المدعى عليه', value: c.defendant,           inline: true },
                    )
                    .setFooter({ text: `قُبلت بواسطة: ${interaction.user.username} • بوت FANTASY` })
                    .setTimestamp();

                // DM المدعي
                try {
                    const plaintiff = await interaction.client.users.fetch(c.plaintiff_id);
                    const dmEmbed = new EmbedBuilder().setTitle('✅ تم قبول قضيتك').setColor(0x2E7D32)
                        .setDescription(`**${c.case_number} — ${c.title}**\n\nتم قبول قضيتك وستتم معالجتها قريباً.`)
                        .setFooter({ text: 'نظام المحاماة • بوت FANTASY' }).setTimestamp();
                    await plaintiff.send({ embeds: [dmEmbed] });
                } catch (_) {}

                const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetBtn)], flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        // ── judge_select: عرض لوحة القاضي المختار علناً ────────────────────
        if (interaction.customId === 'judge_select') {
            try {
                const { buildJudgeDashboard } = require('./commands/judge-dashboard');
                const judges = await db.getJudges();
                const judge  = judges.find(j => j.discord_id === value);
                if (!judge) return interaction.reply({ content: '❌ القاضي غير موجود.', flags: 64 });
                await interaction.channel.send(await buildJudgeDashboard(db, judge.discord_id, judge.judge_name));
                return interaction.reply({ content: '\u200b', flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        // ── lawyer_select: عرض لوحة المحامي المختار علناً ──────────────────
        if (interaction.customId === 'lawyer_select') {
            try {
                const { buildDashboard } = require('./commands/lawyer-dashboard');
                const lawyers = await db.getLawyers();
                const lawyer  = lawyers.find(l => l.discord_id === value);
                if (!lawyer) return interaction.reply({ content: '❌ المحامي غير موجود.', flags: 64 });
                await interaction.channel.send(await buildDashboard(db, lawyer.discord_id, lawyer.lawyer_name));
                return interaction.reply({ content: '\u200b', flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        // ── lawyer_tasks_select: لوحة المهام الخاصة — فقط لصاحبها ──────────
        if (interaction.customId === 'lawyer_tasks_select') {
            try {
                const selectedId = value;
                // ❌ منع المحامي من الدخول على لوحة محامٍ آخر
                if (interaction.user.id !== selectedId)
                    return interaction.reply({ content: '❌ لا يمكنك الدخول على لوحة محامٍ آخر.', flags: 64 });

                const lawyers = await db.getLawyers();
                const lawyer  = lawyers.find(l => l.discord_id === selectedId);
                if (!lawyer)
                    return interaction.reply({ content: '❌ أنت لست مسجلاً كمحامٍ معتمد.', flags: 64 });

                const { buildTasks } = require('./commands/lawyer-tasks');
                const dash = await buildTasks(db, lawyer.discord_id, lawyer.lawyer_name);
                return interaction.reply({ ...dash, flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        // ── رفض / توكيل قاضي / حكم / محامي — فتح موودال ──────────────────────
        // ── case_sel_lawyer: بعد اختيار القضية، اعرض قائمة المحامين ────────
        if (interaction.customId === 'case_sel_lawyer') {
            try {
                const caseId = value;
                const lawyers = await db.getLawyers();
                if (!lawyers.length) return interaction.reply({ content: '❌ لا يوجد محامون معتمدون.', flags: 64 });
                const sel = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder().setCustomId(`lawyer_pick_${caseId}`).setPlaceholder('👨‍⚖️ الخطوة 2: اختر المحامي')
                        .addOptions(lawyers.slice(0,25).map(l => ({ label: l.lawyer_name, value: l.discord_id, description: `ID: ${l.discord_id}` })))
                );
                const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                return interaction.reply({ content: '👨‍⚖️ **الخطوة 2:** اختر المحامي:', components: [sel, new ActionRowBuilder().addComponents(resetBtn)], flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        // ── lawyer_pick_{caseId}: إرسال طلب توكيل للمحامي ──────────────────
        if (interaction.customId.startsWith('lawyer_pick_')) {
            try {
                const caseId   = Number(interaction.customId.replace('lawyer_pick_', ''));
                const lawyerId = value;
                const lawyers  = await db.getLawyers();
                const lawyer   = lawyers.find(l => l.discord_id === lawyerId);
                const c        = await db.getCaseById(caseId);
                if (!c) return interaction.reply({ content: '❌ القضية غير موجودة.', flags: 64 });
                if (!lawyer) return interaction.reply({ content: '❌ المحامي غير موجود.', flags: 64 });

                await db.createLawyerRequest(caseId, c.case_number, c.title, interaction.user.id, c.plaintiff_name, lawyerId);

                // إشعار المحامي بـ DM
                try {
                    const lawyerUser = await interaction.client.users.fetch(lawyerId);
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('📨 طلب توكيل جديد')
                        .setColor(0x0D47A1)
                        .setDescription('> لديك طلب توكيل جديد — استخدم `/محامي` للقبول أو الرفض')
                        .addFields(
                            { name: '🔢 رقم القضية', value: c.case_number,          inline: true },
                            { name: '📌 العنوان',     value: c.title,                inline: true },
                            { name: '👤 الموكّل',     value: c.plaintiff_name,       inline: true },
                        )
                        .setFooter({ text: 'نظام المحاماة • بوت FANTASY' }).setTimestamp();
                    await lawyerUser.send({ embeds: [dmEmbed] });
                } catch (_) {}

                const embed = new EmbedBuilder()
                    .setTitle('📨 تم إرسال طلب التوكيل')
                    .setColor(0x0D47A1)
                    .setDescription(`> تم إرسال طلب التوكيل إلى **${lawyer.lawyer_name}**\nسيُخطَر عبر الرسائل الخاصة، وبإمكانه القبول أو الرفض عبر \`/محامي\``)
                    .addFields(
                        { name: '🔢 رقم القضية', value: c.case_number, inline: true },
                        { name: '📌 العنوان',     value: c.title,       inline: true },
                    )
                    .setFooter({ text: 'نظام المحاماة • بوت FANTASY' }).setTimestamp();
                const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetBtn)], flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        if (['case_sel_reject','case_sel_judge','case_sel_verdict'].includes(interaction.customId)) {
            try {
                const caseId = value;
                const modals = {
                    case_sel_reject:  { id: `case_reject_modal_${caseId}`,  title: '❌ سبب الرفض',      fields: [{ id: 'reason',       label: 'سبب رفض القضية',         long: true  }] },
                    case_sel_judge:   { id: `case_judge_modal_${caseId}`,   title: '👨‍⚖️ تعيين قاضٍ',   fields: [{ id: 'judge_mention', label: 'اسم القاضي (أو منشن)', long: false }] },
                    case_sel_verdict: { id: `case_verdict_modal_${caseId}`, title: '📜 إصدار الحكم',    fields: [{ id: 'verdict',       label: 'نص الحكم',               long: true  }] },
                };
                const cfg = modals[interaction.customId];
                const modal = new ModalBuilder().setCustomId(cfg.id).setTitle(cfg.title);
                modal.addComponents(...cfg.fields.map(f =>
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId(f.id).setLabel(f.label)
                            .setStyle(f.long ? TextInputStyle.Paragraph : TextInputStyle.Short).setRequired(true)
                    )
                ));
                return interaction.showModal(modal);
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        if (interaction.customId === 'phone_menu') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const isPolice = value === 'report_police';
                const modal = new ModalBuilder()
                    .setCustomId(isPolice ? 'report_police_modal' : 'report_ambulance_modal')
                    .setTitle(isPolice ? '🚨 بلاغ شرطة' : '🚑 بلاغ إسعاف');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('report_location').setLabel('الموقع').setStyle(TextInputStyle.Short).setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('report_details').setLabel('تفاصيل البلاغ').setStyle(TextInputStyle.Paragraph).setRequired(true)
                    ),
                );
                return interaction.showModal(modal);
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'central_market_sell') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const loginErr = await db.checkLoginAndIdentity(interaction.user.id);
                if (loginErr) return interaction.reply({ content: loginErr, flags: 64 });

                const identity = await db.getActiveIdentity(interaction.user.id);
                if (!identity) return interaction.reply({ content: '❌ يجب تسجيل الدخول أولاً.', flags: 64 });

                let result;
                if (value === 'all') {
                    result = await db.sellJobItems(interaction.user.id);
                } else {
                    result = await db.sellJobItemsByCategory(interaction.user.id, value);
                }

                const { totalValue, sold } = result;
                if (!sold.length) return interaction.reply({ content: '❌ ليس لديك أي مكاسب من هذه الفئة في حقيبتك.', flags: 64 });

                await db.addToCash(interaction.user.id, identity.slot, totalValue);

                const catLabel = { fishing: '🎣 الأسماك', woodcutting: '🪓 الأخشاب', mining: '⛏️ المعادن', all: '💰 الكل' };
                const lines = sold.map(s =>
                    `• **${s.name}** × ${s.qty} — ${s.price.toLocaleString()} ريال/وحدة = **${s.value.toLocaleString()} ريال**`
                ).join('\n');

                const embed = new EmbedBuilder()
                    .setTitle(`✅ تمت عملية البيع — ${catLabel[value] || ''}`)
                    .setColor(0x00796B)
                    .setDescription(lines)
                    .addFields(
                        { name: '💵 الإجمالي المُحصَّل', value: `**${totalValue.toLocaleString()} ريال**`, inline: false },
                    )
                    .setFooter({ text: 'السوق المركزي • بوت FANTASY' })
                    .setTimestamp();

                const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetBtn)], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'jobs_menu') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const loginErr = await db.checkLoginAndIdentity(interaction.user.id);
                if (loginErr) return interaction.reply({ content: loginErr, flags: 64 });

                const prices = await db.getJobPrices();

                if (value === 'sell') {
                    const identity = await db.getActiveIdentity(interaction.user.id);
                    if (!identity) return interaction.reply({ content: '❌ يجب تسجيل الدخول أولاً.', flags: 64 });
                    const { totalValue, sold } = await db.sellJobItems(interaction.user.id);
                    if (!sold.length) return interaction.reply({ content: '❌ ليس لديك أي مكاسب لبيعها في حقيبتك.', flags: 64 });
                    await db.addToCash(interaction.user.id, identity.slot, totalValue);
                    const lines = sold.map(s => `• **${s.name}** × ${s.qty} — ${s.price.toLocaleString()} ريال/وحدة = **${s.value.toLocaleString()} ريال**`).join('\n');
                    const embed = new EmbedBuilder()
                        .setTitle('💰 تمت عملية البيع')
                        .setColor(0x2E7D32)
                        .setDescription(lines)
                        .addFields({ name: '💵 الإجمالي', value: `**${totalValue.toLocaleString()} ريال**`, inline: false })
                        .setFooter({ text: 'نظام الوظائف • بوت FANTASY' }).setTimestamp();
                    const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                    return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetBtn)], flags: 64 });
                }

                const jobMap = {
                    fishing:     { label: '🎣 صيد السمك',    req: 'سنارة',    items: ['سمك هامور','سالمون','روبيان','حوت'], weights: [20,35,40,5], color: 0x1565C0 },
                    woodcutting: { label: '🪓 تقطيع الخشب',  req: 'فأس',      items: ['خشب'],                             weights: [100],       color: 0x4E342E },
                    mining:      { label: '⛏️ المنجم',        req: 'أدوات المنجم',   items: ['الماس','ذهب','فضة','نحاس'],      weights: [5,20,35,40], color: 0x546E7A },
                };

                const job = jobMap[value];
                if (!job) return;

                const priceLines = job.items.map(it => `• **${it}:** ${(prices[it]||0).toLocaleString()} ريال`).join('\n');
                const embed = new EmbedBuilder()
                    .setTitle(job.label)
                    .setColor(job.color)
                    .addFields(
                        { name: '🎒 المطلوب',       value: job.req,    inline: true },
                        { name: '📦 الكمية',         value: '١ – ١٠ عشوائي', inline: true },
                        { name: '💹 الأسعار الحالية', value: priceLines, inline: false },
                    )
                    .setFooter({ text: 'نظام الوظائف • بوت FANTASY' }).setTimestamp();

                const startBtn  = new ButtonBuilder().setCustomId(`do_job_${value}`).setLabel('▶️ ابدأ').setStyle(ButtonStyle.Success);
                const resetBtn  = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(startBtn, resetBtn)], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
            }
        }

        // ── تصنيع السلاح ───────────────────────────────────────────────────────────
        if (interaction.customId === 'craft_weapon') {
            try {
                const CRAFT_RESOURCES = ['ألمنيوم', 'حديد', 'خشب', 'أربطة', 'مسامير'];
                const CRAFT_WEAPONS = {
                    craft_sns:     { name: 'Pistol SNS',    req: 200 },
                    craft_vintage: { name: 'Pistol Vintage', req: 300 },
                    craft_mkii:    { name: 'Pistol MK II',   req: 500 },
                };
                const weapon = CRAFT_WEAPONS[value];
                if (!weapon) return interaction.reply({ content: '❌ خيار غير صالح.', flags: 65 });

                // تحقق من الموارد وأعرض النقص إن وُجد
                const missing = [];
                for (const res of CRAFT_RESOURCES) {
                    const qty = await db.getItemQty(interaction.user.id, res);
                    if (qty < weapon.req) missing.push(`> ${res}: لديك **${qty}** / تحتاج **${weapon.req}**`);
                }

                if (missing.length) {
                    return interaction.reply({
                        content: `❌ **لا تملك موارد كافية لتصنيع ${weapon.name}**\n${missing.join('\n')}`,
                        flags: 65,
                    });
                }

                await interaction.deferUpdate();
                for (const res of CRAFT_RESOURCES) {
                    await db.removeItem(interaction.user.id, res, weapon.req);
                }
                await db.addItem(interaction.user.id, weapon.name, 1);

                const displayName = interaction.member?.displayName || interaction.user.username;
                await interaction.channel.send(
                    `🔫 **${displayName}** صنّع **${weapon.name}** بنجاح وأضافه إلى حقيبته!`
                );
            } catch (e) {
                console.error(e);
                interaction.reply({ content: '❌ حدث خطأ أثناء التصنيع.', flags: 65 }).catch(() => {});
            }
            return;
        }

        const handler = menuHandlers[interaction.customId];
        if (!handler) return;
        const response = handler[value];
        if (!response) return interaction.reply({ content: 'لا توجد معلومات لهذا الخيار.', flags: 64 });
        return interaction.reply({ content: response, flags: 64 });
    }

    if (interaction.isModalSubmit()) {

        // ── طلب تفعيل الحساب ──────────────────────────────────────────────────
        if (interaction.customId === 'activation_sony_modal') {
            try {
                const sonyId = interaction.fields.getTextInputValue('sony_id').trim();

                const logChannelId = await db.getConfig('activation_log_channel');
                if (!logChannelId)
                    return interaction.reply({ content: '❌ لم يتم تعيين قناة التفعيل بعد. تواصل مع الإدارة.', flags: 64 });

                const logChannel = interaction.guild.channels.cache.get(logChannelId);
                if (!logChannel)
                    return interaction.reply({ content: '❌ قناة التفعيل غير موجودة. تواصل مع الإدارة.', flags: 64 });

                const req = await db.createActivationRequest(
                    interaction.user.id,
                    interaction.user.username,
                    sonyId
                );

                const reqEmbed = new EmbedBuilder()
                    .setTitle('🎮 طلب تفعيل جديد')
                    .setColor(0x1565C0)
                    .addFields(
                        { name: '👤 اللاعب',          value: `<@${interaction.user.id}> (${interaction.user.username})`, inline: false },
                        { name: '🎮 ID سوني (PSN)',   value: `\`${sonyId}\``, inline: true },
                        { name: '🆔 Discord ID',      value: `\`${interaction.user.id}\``, inline: true },
                    )
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setFooter({ text: 'نظام التفعيل • بوت FANTASY' }).setTimestamp();

                const approveBtn = new ButtonBuilder()
                    .setCustomId(`activate_approve_${req.id}`)
                    .setLabel('✅ تفعيل')
                    .setStyle(ButtonStyle.Success);

                const rejectBtn = new ButtonBuilder()
                    .setCustomId(`activate_reject_${req.id}`)
                    .setLabel('❌ رفض')
                    .setStyle(ButtonStyle.Danger);

                await logChannel.send({
                    embeds: [reqEmbed],
                    components: [new ActionRowBuilder().addComponents(approveBtn, rejectBtn)],
                });

                return interaction.reply({
                    content: `✅ **تم إرسال طلب تفعيلك بنجاح!**\n> 🎮 **ID سوني:** \`${sonyId}\`\n> انتظر موافقة الإدارة.`,
                    flags: 64
                });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ أثناء إرسال الطلب.', flags: 64 });
            }
        }

        // ── رفع قضية جديدة ────────────────────────────────────────────────────
        if (interaction.customId === 'new_case_modal') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const identity = await db.getActiveIdentity(interaction.user.id);
                if (!identity) return interaction.reply({ content: '❌ يجب تسجيل الدخول أولاً.', flags: 64 });

                const title      = interaction.fields.getTextInputValue('case_title').trim();
                const defendant  = interaction.fields.getTextInputValue('case_defendant').trim();
                const desc       = interaction.fields.getTextInputValue('case_desc').trim();
                const evidence   = interaction.fields.getTextInputValue('case_evidence')?.trim() || '';
                const lawyerFee  = interaction.fields.getTextInputValue('case_lawyer_fee')?.trim() || '';

                const newCase = await db.createCase(interaction.user.id, identity.full_name || interaction.user.username, defendant, title, desc, evidence, lawyerFee);

                const embed = new EmbedBuilder()
                    .setTitle('📁 تم رفع القضية')
                    .setColor(0x0D47A1)
                    .addFields(
                        { name: '🔢 رقم القضية',    value: newCase.case_number,                inline: true },
                        { name: '📌 العنوان',        value: title,                              inline: true },
                        { name: '⚔️ المدعى عليه',   value: defendant,                           inline: true },
                        { name: '📝 الوصف',          value: desc.slice(0, 300),                 inline: false },
                        { name: '🔍 الأدلة',         value: evidence || 'لا توجد أدلة',         inline: false },
                        { name: '💰 بدل المحاماة',   value: lawyerFee || 'غير محدد',            inline: true },
                        { name: '⏳ الحالة',          value: '⏳ معلقة — بانتظار الإدارة',       inline: true },
                    )
                    .setFooter({ text: 'نظام المحاماة • بوت FANTASY' })
                    .setTimestamp();

                const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);

                // إشعار روم القضايا إن وُجد
                const casesChannelId = await db.getConfig('cases_channel');
                if (casesChannelId) {
                    const ch = interaction.guild?.channels?.cache?.get(casesChannelId);
                    if (ch) ch.send({ embeds: [embed] }).catch(() => {});
                }

                return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetBtn)], flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ أثناء رفع القضية.', flags: 64 }); }
        }

        // ── تأكيد التخلي عن القضية ────────────────────────────────────────────
        if (interaction.customId.startsWith('lawyer_abandon_modal_')) {
            try {
                const caseId = Number(interaction.customId.replace('lawyer_abandon_modal_', ''));
                const reason = interaction.fields.getTextInputValue('abandon_reason').trim();
                const c = await db.getCaseById(caseId);
                if (!c) return interaction.reply({ content: '❌ القضية غير موجودة.', flags: 64 });
                if (c.lawyer_id !== interaction.user.id)
                    return interaction.reply({ content: '❌ أنت لست محامي هذه القضية.', flags: 64 });

                const { ABANDON_FEE } = require('./commands/lawyer-tasks');
                const result = await db.abandonCase(caseId, interaction.user.id, c.plaintiff_id, ABANDON_FEE);

                if (!result.success)
                    return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });

                // إشعار الموكّل بالخاص
                try {
                    const plaintiffUser = await interaction.client.users.fetch(c.plaintiff_id);
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('⚠️ تخلّى المحامي عن قضيتك')
                        .setColor(0xB71C1C)
                        .setDescription(`تخلّى المحامي **${c.lawyer_name}** عن تمثيلك في القضية.`)
                        .addFields(
                            { name: '🔢 رقم القضية',   value: c.case_number, inline: true },
                            { name: '📌 العنوان',       value: c.title,       inline: true },
                            { name: '📝 سبب التخلي',    value: reason,        inline: false },
                            { name: '💰 التعويض',
                              value: `✅ تم إعادة **${ABANDON_FEE.toLocaleString()} ريال** إلى رصيدك`,
                              inline: false },
                        )
                        .setFooter({ text: 'نظام المحاماة • بوت FANTASY' }).setTimestamp();
                    await plaintiffUser.send({ embeds: [dmEmbed] });
                } catch (_) {}

                // رد على المحامي
                await interaction.reply({ content: `✅ تم التخلي عن القضية **${c.case_number}** وخصم **${ABANDON_FEE.toLocaleString()} ريال** من رصيدك كتعويض للموكّل.`, flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        // ── رفض قضية ─────────────────────────────────────────────────────────
        if (interaction.customId.startsWith('case_reject_modal_')) {
            try {
                const caseId = Number(interaction.customId.replace('case_reject_modal_', ''));
                const reason = interaction.fields.getTextInputValue('reason').trim();
                const c      = await db.getCaseById(caseId);
                if (!c) return interaction.reply({ content: '❌ القضية غير موجودة.', flags: 64 });

                await db.rejectCase(caseId, reason, interaction.user.id);

                const embed = new EmbedBuilder()
                    .setTitle('❌ تم رفض القضية')
                    .setColor(0xB71C1C)
                    .addFields(
                        { name: '🔢 رقم القضية',  value: c.case_number,                inline: true },
                        { name: '📌 العنوان',      value: c.title,                     inline: true },
                        { name: '👤 المدعي',       value: `<@${c.plaintiff_id}>`,      inline: true },
                        { name: '❌ سبب الرفض',   value: reason,                       inline: false },
                    )
                    .setFooter({ text: `رُفضت بواسطة: ${interaction.user.username} • بوت FANTASY` })
                    .setTimestamp();

                // DM المدعي بالرفض
                try {
                    const plaintiff = await interaction.client.users.fetch(c.plaintiff_id);
                    const dmEmbed = new EmbedBuilder().setTitle('❌ تم رفض قضيتك').setColor(0xB71C1C)
                        .addFields(
                            { name: '🔢 رقم القضية', value: c.case_number, inline: true },
                            { name: '📌 العنوان',     value: c.title,       inline: true },
                            { name: '❌ سبب الرفض',  value: reason,         inline: false },
                        ).setFooter({ text: 'نظام المحاماة • بوت FANTASY' }).setTimestamp();
                    await plaintiff.send({ embeds: [dmEmbed] });
                } catch (_) {}

                const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetBtn)], flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        // ── توكيل قاضي ───────────────────────────────────────────────────────
        if (interaction.customId.startsWith('case_judge_modal_')) {
            try {
                const caseId    = Number(interaction.customId.replace('case_judge_modal_', ''));
                const judgeText = interaction.fields.getTextInputValue('judge_mention').trim();
                const c         = await db.getCaseById(caseId);
                if (!c) return interaction.reply({ content: '❌ القضية غير موجودة.', flags: 64 });

                // محاولة استخراج ID من المنشن
                const mentionMatch = judgeText.match(/^<@!?(\d+)>$/);
                const judgeId   = mentionMatch ? mentionMatch[1] : null;
                const judgeName = judgeText;

                await db.assignJudge(caseId, judgeId, judgeName);

                const embed = new EmbedBuilder()
                    .setTitle('👨‍⚖️ تم تعيين القاضي')
                    .setColor(0x4A148C)
                    .addFields(
                        { name: '🔢 رقم القضية',   value: c.case_number,           inline: true },
                        { name: '📌 العنوان',       value: c.title,                 inline: true },
                        { name: '👤 المدعي',        value: `<@${c.plaintiff_id}>`,  inline: true },
                        { name: '👨‍⚖️ القاضي',     value: judgeId ? `<@${judgeId}>` : judgeName, inline: true },
                        { name: '⚖️ الحالة',        value: '⚖️ جارية',             inline: true },
                    )
                    .setFooter({ text: `عُيِّن بواسطة: ${interaction.user.username} • بوت FANTASY` })
                    .setTimestamp();

                const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);
                return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetBtn)], flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        // ── إصدار حكم ────────────────────────────────────────────────────────
        if (interaction.customId.startsWith('case_verdict_modal_')) {
            try {
                const caseId  = Number(interaction.customId.replace('case_verdict_modal_', ''));
                const verdict = interaction.fields.getTextInputValue('verdict').trim();
                const c       = await db.getCaseById(caseId);
                if (!c) return interaction.reply({ content: '❌ القضية غير موجودة.', flags: 64 });

                await db.issueVerdict(caseId, verdict, interaction.user.id);

                const embed = new EmbedBuilder()
                    .setTitle('📜 صدر الحكم')
                    .setColor(0x1B5E20)
                    .addFields(
                        { name: '🔢 رقم القضية',   value: c.case_number,          inline: true },
                        { name: '📌 العنوان',       value: c.title,                inline: true },
                        { name: '👤 المدعي',        value: `<@${c.plaintiff_id}>`, inline: true },
                        { name: '⚔️ المدعى عليه',  value: c.defendant,            inline: true },
                        { name: '👨‍⚖️ القاضي',     value: c.judge_name || 'غير محدد', inline: true },
                        { name: '📜 الحكم',         value: verdict,                inline: false },
                        { name: '🔒 الحالة',        value: '🔒 مغلقة',             inline: true },
                    )
                    .setFooter({ text: `أصدره: ${interaction.user.username} • بوت FANTASY` })
                    .setTimestamp();

                const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);

                // DM المدعي بالحكم
                try {
                    const plaintiff = await interaction.client.users.fetch(c.plaintiff_id);
                    const dmEmbed = new EmbedBuilder().setTitle('📜 صدر حكم في قضيتك').setColor(0x1B5E20)
                        .addFields(
                            { name: '🔢 رقم القضية', value: c.case_number,               inline: true },
                            { name: '📌 العنوان',     value: c.title,                    inline: true },
                            { name: '👨‍⚖️ القاضي',   value: c.judge_name || 'غير محدد', inline: true },
                            { name: '📜 الحكم',       value: verdict,                    inline: false },
                        ).setFooter({ text: 'نظام العدل • بوت FANTASY' }).setTimestamp();
                    await plaintiff.send({ embeds: [dmEmbed] });
                } catch (_) {}

                // إشعار روم الأحكام إن وُجد
                const verdictsChannelId = await db.getConfig('verdicts_channel');
                if (verdictsChannelId) {
                    const ch = interaction.guild?.channels?.cache?.get(verdictsChannelId);
                    if (ch) ch.send({ embeds: [embed] }).catch(() => {});
                }

                return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetBtn)], flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        // ── توكيل محامي (طلب) ────────────────────────────────────────────────
        if (interaction.customId.startsWith('case_lawyer_modal_')) {
            try {
                const caseId     = Number(interaction.customId.replace('case_lawyer_modal_', ''));
                const lawyerName = interaction.fields.getTextInputValue('lawyer_name').trim();
                const reason     = interaction.fields.getTextInputValue('lawyer_reason').trim();
                const c          = await db.getCaseById(caseId);
                if (!c) return interaction.reply({ content: '❌ القضية غير موجودة.', flags: 64 });

                await db.assignLawyer(caseId, null, lawyerName);

                const embed = new EmbedBuilder()
                    .setTitle('👨‍⚖️ طلب توكيل محامٍ')
                    .setColor(0xE65100)
                    .addFields(
                        { name: '🔢 رقم القضية',    value: c.case_number,           inline: true },
                        { name: '📌 العنوان',        value: c.title,                 inline: true },
                        { name: '👤 المدعي',         value: `<@${c.plaintiff_id}>`,  inline: true },
                        { name: '👨‍⚖️ المحامي المطلوب', value: lawyerName,           inline: true },
                        { name: '📝 سبب الطلب',      value: reason,                  inline: false },
                    )
                    .setFooter({ text: 'نظام المحاماة • بوت FANTASY' })
                    .setTimestamp();

                const resetBtn = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);

                // إشعار روم القضايا إن وُجد
                const casesChannelId = await db.getConfig('cases_channel');
                if (casesChannelId) {
                    const ch = interaction.guild?.channels?.cache?.get(casesChannelId);
                    if (ch) ch.send({ embeds: [embed] }).catch(() => {});
                }

                return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetBtn)], flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 }); }
        }

        if (interaction.customId === 'report_police_modal' || interaction.customId === 'report_ambulance_modal') {
            try {
                const isPolice   = interaction.customId === 'report_police_modal';
                const location   = interaction.fields.getTextInputValue('report_location').trim();
                const details    = interaction.fields.getTextInputValue('report_details').trim();
                const configKey  = isPolice ? 'police_reports_channel' : 'ambulance_reports_channel';
                const channelId  = await db.getConfig(configKey);
                if (!channelId) return interaction.reply({ content: `❌ لم يتم تحديد روم البلاغات. تواصل مع الإدارة.`, flags: 64 });

                const identity = await db.getActiveIdentity(interaction.user.id);
                const charName = identity ? (identity.character_name || interaction.user.username) : interaction.user.username;

                const embed = new EmbedBuilder()
                    .setTitle(isPolice ? '🚨 بلاغ شرطة' : '🚑 بلاغ إسعاف')
                    .setColor(isPolice ? 0xB71C1C : 0x1565C0)
                    .addFields(
                        { name: '👤 المُبلِّغ',        value: `<@${interaction.user.id}> — \`${charName}\``, inline: false },
                        { name: '📍 الموقع',            value: location,  inline: true },
                        { name: '📋 تفاصيل البلاغ',    value: details,   inline: false },
                    )
                    .setFooter({ text: `نظام البلاغات • بوت FANTASY` })
                    .setTimestamp();

                try {
                    const ch = await client.channels.fetch(channelId);
                    if (ch) await ch.send({ embeds: [embed] });
                } catch {}

                return interaction.reply({ content: `✅ تم إرسال ${isPolice ? 'بلاغ الشرطة' : 'بلاغ الإسعاف'} بنجاح.`, flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'bank_deposit_modal') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const loginErr = await db.checkLoginAndIdentity(interaction.user.id);
                if (loginErr) return interaction.reply({ content: loginErr, flags: 64 });
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
                return interaction.reply({ embeds: [embed] , flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'bank_withdraw_modal') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const loginErr = await db.checkLoginAndIdentity(interaction.user.id);
                if (loginErr) return interaction.reply({ content: loginErr, flags: 64 });
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
                return interaction.reply({ embeds: [embed] , flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'bank_transfer_modal') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const loginErr = await db.checkLoginAndIdentity(interaction.user.id);
                if (loginErr) return interaction.reply({ content: loginErr, flags: 64 });
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
                return interaction.reply({ embeds: [embed] , flags: 64 });
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
                const { buildSnap } = require('./commands/snap');
                const account = await db.getSnapAccount(interaction.user.id);
                const img = await db.getImage('سناب شات');
                return interaction.reply(buildSnap(account, img));
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
                return interaction.reply({ embeds: [embed] , flags: 64 });
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
                const { buildTweetMessage } = require('./commands/tweet');
                const { embed: tweetEmbed, row: tweetRow } = buildTweetMessage(post, interaction.user.displayAvatarURL());
                const xChannel = interaction.guild?.channels?.cache.get(xChannelId);
                if (xChannel) await xChannel.send({ embeds: [tweetEmbed], components: [tweetRow] });
                return interaction.reply({ content: `✅ تم نشر تغريدتك في <#${xChannelId}>`, flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ أثناء نشر التغريدة.', flags: 64 });
            }
        }

        if (interaction.customId.startsWith('x_reply_modal_')) {
            try {
                const postId = parseInt(interaction.customId.replace('x_reply_modal_', ''));
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const content = interaction.fields.getTextInputValue('reply_content').trim();
                const myAcc = await db.getXAccount(interaction.user.id);
                if (!myAcc) return interaction.reply({ content: '❌ ليس لديك حساب على منصة X.', flags: 64 });
                const xChannelId = await db.getConfig('x_channel');
                if (!xChannelId) return interaction.reply({ content: '❌ لم يتم تحديد روم التغريدات.', flags: 64 });
                const orig = await db.getPostById(postId);
                if (!orig) return interaction.reply({ content: '❌ التغريدة الأصلية غير موجودة.', flags: 64 });
                const reply = await db.replyPost(interaction.user.id, postId, content);
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `@${myAcc.x_username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setColor(0x17BF63)
                    .setDescription(content)
                    .addFields(
                        { name: '↩️ رداً على', value: `@${orig.x_username} • #${postId}`, inline: true },
                        { name: '🆔 رقم الرد', value: `\`#${reply.id}\``, inline: true },
                    )
                    .setFooter({ text: 'منصة X • بوت FANTASY' })
                    .setTimestamp();
                const xChannel = interaction.guild?.channels?.cache.get(xChannelId);
                if (xChannel) await xChannel.send({ embeds: [embed] });
                return interaction.reply({ content: `✅ تم نشر ردك في <#${xChannelId}>`, flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ أثناء نشر الرد.', flags: 64 });
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

        if (interaction.customId === 'trip_start_modal') {
            try {
                const startChannelId  = await db.getConfig('trips_start_channel');
                const alertsChannelId = await db.getConfig('trips_alerts_channel');
                if (!startChannelId) return interaction.reply({ content: '❌ لم يتم تحديد روم بدء الرحلة. استخدم `/إعداد-رحلات` أولاً.', flags: 64 });

                const hostId     = interaction.fields.getTextInputValue('trip_host_id').trim();
                const deputy     = interaction.fields.getTextInputValue('trip_deputy').trim();
                const supervisor = interaction.fields.getTextInputValue('trip_supervisor').trim();
                const tripTime   = interaction.fields.getTextInputValue('trip_time').trim();

                await db.setConfig('trip_open', 'true');
                await db.setConfig('hurricane_active', 'false');

                const embed = new EmbedBuilder()
                    .setTitle('✈️ بدء رحلة جديدة!')
                    .setColor(0x2E7D32)
                    .setDescription('🎉 **تم فتح رحلة جديدة! يمكن لجميع اللاعبين تسجيل الدخول.**')
                    .addFields(
                        { name: '🎤 الهوست',       value: `\`${hostId}\``, inline: true },
                        { name: '🎤 نائب الهوست', value: deputy,           inline: true },
                        { name: '👁️ الرقابي',      value: supervisor,      inline: true },
                        { name: '🕐 وقت الرحلة',  value: tripTime,         inline: true },
                        { name: '🔧 بدأها',         value: `<@${interaction.user.id}>`, inline: true },
                    )
                    .setFooter({ text: 'نظام الرحلات • بوت FANTASY' })
                    .setTimestamp();

                try {
                    const ch = await client.channels.fetch(startChannelId);
                    if (ch) await ch.send({ embeds: [embed] });
                } catch {}
                sendToCharLog(embed);
                return interaction.reply({ content: '✅ تم إرسال إشعار بدء الرحلة.', flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'trip_renewal_modal') {
            try {
                const alertsChannelId = await db.getConfig('trips_alerts_channel');
                if (!alertsChannelId) return interaction.reply({ content: '❌ لم يتم تحديد روم التنبيهات. استخدم `/إعداد-رحلات` أولاً.', flags: 64 });

                const hostId = interaction.fields.getTextInputValue('renewal_host_id').trim();

                const embed = new EmbedBuilder()
                    .setTitle('🔄 تجديد الرحلة')
                    .setColor(0x1565C0)
                    .setDescription('🔄 **تم تجديد الرحلة!**')
                    .addFields(
                        { name: '🎤 ID الهوست',  value: `\`${hostId}\``, inline: true },
                        { name: '🔧 جدّدها',      value: `<@${interaction.user.id}>`, inline: true },
                    )
                    .setFooter({ text: 'نظام الرحلات • بوت FANTASY' })
                    .setTimestamp();

                try {
                    const ch = await client.channels.fetch(alertsChannelId);
                    if (ch) await ch.send({ embeds: [embed] });
                } catch {}
                return interaction.reply({ content: '✅ تم إرسال إشعار التجديد.', flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'trip_alert_modal') {
            try {
                const alertsChannelId = await db.getConfig('trips_alerts_channel');
                if (!alertsChannelId) return interaction.reply({ content: '❌ لم يتم تحديد روم التنبيهات. استخدم `/إعداد-رحلات` أولاً.', flags: 64 });

                const alertText = interaction.fields.getTextInputValue('alert_text').trim();

                const embed = new EmbedBuilder()
                    .setTitle('📣 تنبيه')
                    .setColor(0xF57F17)
                    .setDescription(alertText)
                    .addFields({ name: '🔧 أرسله', value: `<@${interaction.user.id}>`, inline: true })
                    .setFooter({ text: 'نظام الرحلات • بوت FANTASY' })
                    .setTimestamp();

                try {
                    const ch = await client.channels.fetch(alertsChannelId);
                    if (ch) await ch.send({ embeds: [embed] });
                } catch {}
                return interaction.reply({ content: '✅ تم إرسال التنبيه.', flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ حدث خطأ.', flags: 64 });
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

    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.autocomplete) {
            try { await command.autocomplete(interaction, db); } catch (e) { console.error(e); }
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
    // حذف رسائل البوت — الإمبيدات الرئيسية (تحتوي embed + قائمة/زر) تبقى دائمة
    if (message.author.id === client.user?.id) {
        const isPanel = message.embeds.length > 0 && message.components.length > 0;
        if (!isPanel) setTimeout(() => message.delete().catch(() => {}), 60_000);
        return;
    }
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

client.on('error', (err) => console.error('Discord client error:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
process.on('uncaughtException',  (err) => console.error('Uncaught exception:', err));
process.on('SIGTERM', () => { console.log('SIGTERM received — exiting.'); process.exit(0); });
process.on('SIGINT',  () => { console.log('SIGINT received — exiting.');  process.exit(0); });

// ── فحص دوري كل دقيقة لرفع المخالفات المنتهية ──────────────────────────
setInterval(async () => {
    try {
        const expired = await db.getExpiredViolations();
        if (!expired.length) return;

        const banRoleId        = await db.getConfig('violation_role_id');
        const activationRoleId = await db.getConfig('activation_role_id');
        const identityRoleId   = await db.getConfig('identity_role');

        for (const v of expired) {
            try {
                const guild = client.guilds.cache.first();
                if (!guild) continue;
                const member = await guild.members.fetch(v.user_id).catch(() => null);

                if (member) {
                    // جمع الرتب المراد إعادتها
                    const rolesToRestore = new Set();

                    try {
                        const saved = JSON.parse(v.saved_roles || '[]');
                        saved.forEach(id => rolesToRestore.add(id));
                    } catch (_) {}

                    if (activationRoleId) rolesToRestore.add(activationRoleId);
                    if (identityRoleId)   rolesToRestore.add(identityRoleId);
                    if (banRoleId)        rolesToRestore.delete(banRoleId);

                    // إزالة رتبة الباند
                    if (banRoleId) {
                        const banRole = guild.roles.cache.get(banRoleId);
                        if (banRole) await member.roles.remove(banRole).catch(() => {});
                    }

                    // إعادة الرتب السابقة
                    for (const roleId of rolesToRestore) {
                        const role = guild.roles.cache.get(roleId);
                        if (role) await member.roles.add(role).catch(() => {});
                    }
                }

                await db.removeViolation(v.user_id);

                // إشعار اللاعب
                try {
                    const user = await client.users.fetch(v.user_id);
                    await user.send(`✅ **انتهت مدة مخالفتك في سيرفر ${guild?.name || 'السيرفر'} — تم رفع الباند وإعادة جميع رتبك تلقائياً.**`);
                } catch (_) {}
            } catch (e) { console.error('violation cleanup error:', e); }
        }
    } catch (e) { console.error('violation interval error:', e); }
}, 60_000);

client.login(process.env.DISCORD_TOKEN);
