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
        identity: 'الهوية: عرض شخصيتك الحالية واختيار بين 4 شخصيات.',
        phone: 'الجوال: عرض هاتفك المحمول وإدارة اتصالاتك.',
        bag: 'الحقيبة: عرض أغراضك وعناصرك المحفوظة.',
        bank: 'البنك: عرض رصيدك وإجراء التحويلات.',
        police: 'الشرطة: أوامر الشرطة (كلبشة، تلويت، باند، تشهير).',
        events: 'الرحلات والأحداث: فتح رحلة، إعصار، تنبيهات.',
        jobs: 'الوظائف: صيد السمك، تكسي، صيد الحيوانات، منجم.',
        market: 'سوق الأدوات: سنارة، فأس، أدوات، مزاد سيارات وعقارات.',
        law: 'المحاماة: إدارة القضايا والمحاماة.',
        admin: 'الإدارة: عرض الرتب ونقاط الإدارة.',
        crime: 'الجرائم: سرقات وعمليات الخطف.',
        tickets: 'التكتات: فتح تكت جديد (شكوى، اقتراح، بلاغ، استفسار).',
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
