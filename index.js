const fs = require('fs');
const { Client, Collection, GatewayIntentBits, EmbedBuilder } = require('discord.js');
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

client.on('interactionCreate', async interaction => {
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
            const slotNum = parseInt(value.replace('char_', ''));
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                await db.setActiveSlot(interaction.user.id, slotNum);
                const identity = await db.ensureIdentity(interaction.user.id, slotNum);
                const embed = new EmbedBuilder()
                    .setTitle(`🪪 تم التبديل للشخصية ${slotNum}`)
                    .setColor(0x4A148C)
                    .addFields(
                        { name: '👤 الشخصية', value: `**شخصية ${slotNum}**`, inline: true },
                        { name: '🏦 رقم الإيبان', value: `\`${identity.iban}\``, inline: true },
                        { name: '💰 الرصيد', value: `\`${Number(identity.balance).toLocaleString()} ريال\``, inline: true },
                    )
                    .setFooter({ text: 'نظام الهوية • بوت FANTASY' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'حدث خطأ أثناء تبديل الشخصية.', flags: 64 });
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

        const handler = menuHandlers[interaction.customId];
        if (!handler) return;
        const response = handler[value];
        if (!response) return interaction.reply({ content: 'لا توجد معلومات لهذا الخيار.', flags: 64 });
        return interaction.reply({ content: response, flags: 64 });
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
