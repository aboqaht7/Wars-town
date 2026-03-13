const fs = require('fs');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
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
        identity: '🪪 **الهوية** — عرض شخصيتك الحالية واختيار بين 4 شخصيات.',
        phone: '📱 **الجوال** — عرض هاتفك المحمول وإدارة اتصالاتك.',
        bag: '🎒 **الحقيبة** — عرض أغراضك وعناصرك المحفوظة.',
        bank: '🏦 **البنك** — عرض رصيدك وإجراء التحويلات.',
        police: '👮 **الشرطة** — أوامر الشرطة (كلبشة، تلويت، باند، تشهير).',
        events: '✈️ **الرحلات والأحداث** — فتح رحلة، إعصار، تنبيهات.',
        jobs: '💼 **الوظائف** — صيد السمك، تكسي، صيد الحيوانات، منجم.',
        market: '🛒 **سوق الأدوات** — سنارة، فأس، أدوات، مزاد سيارات وعقارات.',
        law: '⚖️ **المحاماة** — إدارة القضايا والمحاماة.',
        admin: '🛡️ **الإدارة** — عرض الرتب ونقاط الإدارة.',
        crime: '🔫 **الجرائم** — سرقات وعمليات الخطف.',
        tickets: '🎫 **التكتات** — فتح تكت جديد (شكوى، اقتراح، بلاغ، استفسار).',
    },
    admin_menu: {
        ranks: '🏅 **عرض الرتب** — تواصل مع الإدارة لعرض رتبتك الحالية.',
        points: '⭐ **نقاط الإدارة** — تواصل مع الإدارة لمعرفة نقاطك.',
        manage: '👥 **إدارة اللاعبين** — صلاحية خاصة بالإدارة فقط.',
        logs: '📋 **سجل الإجراءات** — سجل جميع الإجراءات الإدارية.',
    },
    bag_menu: {
        view: '👀 **عرض الأغراض** — عرض كل ما في حقيبتك حالياً.',
        use: '✅ **استخدام غرض** — تواصل مع الإدارة لاستخدام غرض.',
        drop: '🗑️ **إلقاء غرض** — تواصل مع الإدارة لإلقاء غرض من حقيبتك.',
        transfer: '📦 **نقل غرض** — تواصل مع الإدارة لنقل غرض لشخص آخر.',
    },
    bank_menu: {
        balance: '💰 **عرض الرصيد** — رصيدك الحالي في البنك.',
        transfer: '💸 **تحويل مبلغ** — تواصل مع الإدارة لإجراء تحويل.',
        deposit: '📥 **إيداع** — تواصل مع الإدارة لإيداع مبلغ.',
        withdraw: '📤 **سحب** — تواصل مع الإدارة لسحب مبلغ.',
    },
    police_menu: {
        handcuff: '🔗 **كلبشة** — تواصل مع ضابط الشرطة لتنفيذ الكلبشة.',
        wanted: '🚨 **تلويت** — تواصل مع الشرطة لوضع اللاعب في قائمة المطلوبين.',
        ban: '🚫 **باند** — تواصل مع الإدارة لتنفيذ الباند.',
        defame: '📢 **تشهير** — تواصل مع الشرطة لتنفيذ التشهير.',
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
    phone_menu: {
        call: '📞 **اتصال** — تواصل مع الإدارة لإجراء مكالمة.',
        messages: '💬 **رسائل** — تواصل مع الإدارة لعرض رسائلك.',
        contacts: '📒 **جهات الاتصال** — تواصل مع الإدارة لعرض جهات الاتصال.',
        settings: '⚙️ **الإعدادات** — تواصل مع الإدارة لتعديل إعدادات الجوال.',
    },
    cars_menu: {
        toyota: '🚗 **تويوتا** — سيارات موثوقة وعملية بأسعار معقولة.',
        mercedes: '🚘 **مرسيدس** — فخامة وأناقة لا مثيل لها.',
        bmw: '🏎️ **بي إم دبليو** — أداء رياضي وتصميم راقٍ.',
        lexus: '🚙 **لكزس** — رفاهية يابانية بجودة عالية.',
        auction: '🔨 **مزاد السيارات** — تواصل مع الإدارة لحضور المزاد.',
    },
    health_menu: {
        hospital_resuscitation: '🏥 **إنعاش مستشفى** — تواصل مع طاقم المستشفى لإنعاشك.',
        decay: '💀 **تحلل** — شخصيتك في وضع التحلل، تواصل مع الإدارة.',
        witch_resuscitation: '🧙 **إنعاش ساحرة** — تواصل مع الساحرة للحصول على الإنعاش.',
    },
    identity_menu: {
        char1: '👤 **شخصية 1** — شخصيتك الأولى النشطة.',
        char2: '👤 **شخصية 2** — شخصيتك الثانية النشطة.',
        char3: '🔒 **شخصية 3** — هذه الشخصية مقفلة، تواصل مع الإدارة.',
        char4: '🔒 **شخصية 4** — هذه الشخصية مقفلة، تواصل مع الإدارة.',
    },
    properties_menu: {
        villa: '🏡 **فيلا** — فيلا فاخرة، تواصل مع الإدارة لاستفسارات الشراء.',
        apartment: '🏢 **شقة** — شقة سكنية، تواصل مع الإدارة لاستفسارات الشراء.',
        land: '🌍 **أرض** — أرض للبناء، تواصل مع الإدارة لاستفسارات الشراء.',
        office: '🏬 **مكتب تجاري** — مكتب للأعمال، تواصل مع الإدارة لاستفسارات الشراء.',
    },
    ticket_menu: {
        complaint: '📋 **شكوى** — لتقديم شكواك اكتب تفاصيلها وأرسلها للإدارة.',
        suggestion: '💡 **اقتراح** — اكتب اقتراحك وسيتم مراجعته من قِبل الإدارة.',
        report: '🚨 **بلاغ** — اكتب تفاصيل البلاغ مع الأدلة وأرسله للإدارة.',
        inquiry: '❓ **استفسار** — اكتب استفسارك وستحصل على رد من الإدارة.',
    },
};

client.on('interactionCreate', async interaction => {
    if (interaction.isStringSelectMenu()) {
        const handler = menuHandlers[interaction.customId];
        if (!handler) return;
        const value = interaction.values[0];
        const response = handler[value] || 'لا توجد معلومات لهذا الخيار.';
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
    const commandName = args.shift().toLowerCase();
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
