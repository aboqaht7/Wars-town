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
    bag_menu: {
        view: null,
        transfer_help: '📤 **نقل غرض** — استخدم: `-نقل [اسم الغرض] @المستخدم`\nمثال: `-نقل سنارة @اللاعب`',
    },
    bank_menu: {
        balance: null,
        transfer_help: '💸 **تحويل مال** — استخدم: `-تحويل [إيبان] [مبلغ]`\nمثال: `-تحويل 1234567 500`',
        iban: null,
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
    phone_menu: {},
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
                    await command.slashExecute(interaction, db);
                } catch (e) {
                    console.error(e);
                    if (!interaction.replied) interaction.reply({ content: 'حدث خطأ.', flags: 64 });
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
                    await interaction.update({ embeds: [resultEmbed], components: [] });

                    try {
                        const user = await client.users.fetch(pending.discord_id);
                        await user.send(`✅ **تم قبول طلب هويتك!**\n**شخصية ${pending.slot}:** ${pending.char_name} ${pending.family_name}\n🏦 الإيبان: \`${char.iban}\``);
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
                    await interaction.update({ embeds: [resultEmbed], components: [] });

                    try {
                        const user = await client.users.fetch(pending.discord_id);
                        await user.send(`❌ **تم رفض طلب هويتك للشخصية ${pending.slot}.**\nتواصل مع الإدارة للمزيد من التفاصيل.`);
                    } catch {}
                }
            } catch (e) {
                console.error(e);
                if (!interaction.replied && !interaction.deferred) interaction.reply({ content: 'حدث خطأ.', flags: 64 });
            }
            return;
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
                    const identities = await db.getUserIdentities(interaction.user.id);
                    const slotNames = { 1: 'الشخصية الأولى', 2: 'الشخصية الثانية', 3: 'الشخصية الثالثة' };
                    const emptySlots = [1, 2, 3].filter(s => !identities.find(i => i.slot === s && i.character_name));
                    if (!emptySlots.length) {
                        return interaction.reply({ content: '❌ شخصياتك الثلاث مكتملة. لا يمكن إنشاء هوية جديدة.', flags: 64 });
                    }
                    const slotOptions = emptySlots.map(s => ({
                        label: slotNames[s],
                        value: `create_slot_${s}`,
                        description: 'إنشاء هوية جديدة',
                    }));
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
                    await db.logoutIdentity(interaction.user.id);
                    await db.addCharacterLog(interaction.user.id, interaction.user.username, 'logout', activeChar?.character_name || null, status.active_slot);
                    const embed = new EmbedBuilder()
                        .setTitle('🚪 تسجيل الخروج')
                        .setColor(0x757575)
                        .setDescription(`تم تسجيل الخروج من شخصية **${activeChar?.character_name || `شخصية ${status.active_slot}`} ${activeChar?.family_name || ''}**`)
                        .setFooter({ text: 'نظام الهوية • بوت FANTASY' })
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed] });
                }
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ.', flags: 64 });
            }
        }

        if (interaction.customId === 'identity_create_slot') {
            const slot = parseInt(value.replace('create_slot_', ''));
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
                const embed = new EmbedBuilder()
                    .setTitle(`✅ تسجيل الدخول — شخصية ${slot}`)
                    .setColor(0x2E7D32)
                    .addFields(
                        { name: '👤 الاسم', value: `${char.character_name} ${char.family_name || ''}`, inline: true },
                        { name: '⚧ الجنس', value: char.gender || '—', inline: true },
                        { name: '📅 تاريخ الميلاد', value: char.birth_date || '—', inline: true },
                        { name: '📍 مكان الولادة', value: char.birth_place || '—', inline: true },
                        { name: '🏦 الإيبان', value: `\`${char.iban}\``, inline: true },
                        { name: '💰 الرصيد', value: `\`${Number(char.balance).toLocaleString()} ريال\``, inline: true },
                    )
                    .setFooter({ text: 'نظام الهوية • بوت FANTASY' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed] });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ أثناء تسجيل الدخول.', flags: 64 });
            }
        }

        if (interaction.customId === 'bank_menu') {
            if (value === 'balance' || value === 'iban') {
                try {
                    await db.ensureUser(interaction.user.id, interaction.user.username);
                    const identity = await db.getActiveIdentity(interaction.user.id);
                    const embed = new EmbedBuilder()
                        .setTitle('🏦 معلومات حسابك')
                        .setColor(0x2E7D32)
                        .addFields(
                            { name: '🏦 رقم الإيبان', value: `\`${identity.iban}\``, inline: true },
                            { name: '💰 الرصيد', value: `\`${Number(identity.balance).toLocaleString()} ريال\``, inline: true },
                            { name: '👤 الشخصية', value: `شخصية ${identity.slot}`, inline: true },
                        )
                        .setFooter({ text: 'نظام البنك • بوت FANTASY' })
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], flags: 64 });
                } catch (e) {
                    console.error(e);
                    return interaction.reply({ content: 'حدث خطأ.', flags: 64 });
                }
            }
        }

        if (interaction.customId === 'bag_menu') {
            if (value === 'view') {
                try {
                    await db.ensureUser(interaction.user.id, interaction.user.username);
                    const items = await db.getInventory(interaction.user.id);
                    const embed = new EmbedBuilder()
                        .setTitle('🎒 محتويات حقيبتك')
                        .setColor(0xE65100)
                        .setDescription(items.length
                            ? items.map(i => `• **${i.item_name}** — الكمية: \`${i.quantity}\``).join('\n')
                            : '> حقيبتك فارغة حالياً')
                        .setFooter({ text: 'نظام الحقيبة • بوت FANTASY' })
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], flags: 64 });
                } catch (e) {
                    console.error(e);
                    return interaction.reply({ content: 'حدث خطأ.', flags: 64 });
                }
            }
        }

        if (interaction.customId === 'phone_menu') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                if (value === 'messages') {
                    const msgs = await db.getMessages(interaction.user.id, 8);
                    await db.markMessagesRead(interaction.user.id);
                    const embed = new EmbedBuilder()
                        .setTitle('📬 صندوق الرسائل')
                        .setColor(0x00838F)
                        .setFooter({ text: 'نظام الجوال • بوت FANTASY' })
                        .setTimestamp();
                    if (!msgs.length) {
                        embed.setDescription('> لا توجد رسائل. استخدم `-رسالة @مستخدم [نص]` للإرسال');
                    } else {
                        for (const m of msgs) {
                            const dir = m.sender_id === interaction.user.id ? '📤' : '📥';
                            const name = m.sender_id === interaction.user.id ? m.receiver_name : m.sender_name;
                            embed.addFields({ name: `${dir} @${name || 'مجهول'}`, value: `> ${m.content}`, inline: false });
                        }
                    }
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }
                if (value === 'contacts') {
                    const contacts = await db.getContacts(interaction.user.id);
                    const embed = new EmbedBuilder()
                        .setTitle('📒 جهات الاتصال')
                        .setColor(0x00838F)
                        .setDescription(contacts.length
                            ? contacts.map(c => `• **${c.nickname || c.username}** — <@${c.contact_id}>`).join('\n')
                            : '> لا توجد جهات اتصال. استخدم `-جهات @مستخدم [الاسم]`')
                        .setFooter({ text: 'نظام الجوال • بوت FANTASY' })
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }
                if (value === 'x_platform') {
                    const posts = await db.getXTimeline(6);
                    const embed = new EmbedBuilder()
                        .setTitle('𝕏 منصة X — آخر المنشورات')
                        .setColor(0x000000)
                        .setFooter({ text: 'منصة X • بوت FANTASY' })
                        .setTimestamp();
                    if (!posts.length) {
                        embed.setDescription('> لا توجد منشورات بعد. استخدم `-تغريد [نص]`');
                    } else {
                        for (const p of posts) {
                            embed.addFields({
                                name: `@${p.username}`,
                                value: `${p.content}\n❤️ \`${p.likes}\` إعجاب`,
                                inline: false,
                            });
                        }
                    }
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ.', flags: 64 });
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
                    const embed = new EmbedBuilder()
                        .setTitle('🌀 تحذير — إعصار!')
                        .setColor(0xB71C1C)
                        .setDescription('⚠️ **تم تفعيل حدث الإعصار!**\n\n🚪 تم تسجيل خروج **جميع اللاعبين** تلقائياً.\n✈️ **تسجيل الدخول متوقف** حتى يتم فتح رحلة جديدة.')
                        .setFooter({ text: 'نظام الأحداث • بوت FANTASY' })
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed] });
                }
                if (value === 'open_flight') {
                    await db.setConfig('trip_open', 'true');
                    await db.setConfig('hurricane_active', 'false');
                    const embed = new EmbedBuilder()
                        .setTitle('✈️ تم فتح الرحلة!')
                        .setColor(0x2E7D32)
                        .setDescription('✅ **الرحلة مفتوحة الآن!**\n\n🎉 يمكن لجميع اللاعبين **تسجيل الدخول** بشخصياتهم.')
                        .setFooter({ text: 'نظام الأحداث • بوت FANTASY' })
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed] });
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
