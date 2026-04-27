const fs = require('fs');

/* ── مرجع رسالة سوق الأسهم الحية ───────────────────────────────────────── */
let stockMarketMsg = null;

async function refreshStockMarket(db) {
    if (!stockMarketMsg) return;
    try {
        const { buildMarketEmbed } = require('./commands/سوق-الأسهم');
        const built = await buildMarketEmbed(db);
        if (!built) return;
        await stockMarketMsg.edit({ embeds: [built.embed], components: [built.row] });
    } catch (e) {
        console.error('[STOCK REFRESH]', e.message);
        stockMarketMsg = null;
    }
}

/* ── تطبيع النص العربي للبحث ────────────────────────────────────────────── */
function normalizeAr(str) {
    if (!str) return '';
    return str
        .trim()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

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
process.on('unhandledRejection', (err) => {
    if (err?.code === 40060 || err?.code === 10062) return;
    console.error('Unhandled rejection:', err?.message || err);
});
/* ───────────────────────────────────────────────────────────────────────── */

const {
    Client, Collection, GatewayIntentBits, EmbedBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    ActionRowBuilder, StringSelectMenuBuilder,
    ButtonBuilder, ButtonStyle, PermissionFlagsBits,
    AuditLogEvent, Partials
} = require('discord.js');
const db = require('./database');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildEmojisAndStickers],
    partials: [Partials.Message, Partials.Channel]
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

/* ── منع معالجة نفس التفاعل مرتين (مشكلة Gateway) ────────────────────── */
const _handledInteractions = new Set();
function markInteraction(id) {
    if (_handledInteractions.has(id)) return false;
    _handledInteractions.add(id);
    setTimeout(() => _handledInteractions.delete(id), 10_000);
    return true;
}

/* ── جلسات التراكينق: targetId → { code, trackerId, channelId, guildId, timer } ── */
const trackingSessions = new Map();

client.once('clientReady', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    // ── ضبط رسائل الرحلات الافتراضية ──────────────────────────────────────
    try {
        await db.setConfig('trip_start_message',
`— FANTASY TOWN Flight Announcement —

 - Captain ID: {هوست}

- Co-Pilot ID: {نائب}

— Join Time: {وقت}

— Observer: {رقابي}

- Important Notes:

- Add the Captain and Co-Pilot.

- Do not disturb the Captain or Co-Pilot.
|| @everyone ||`);

        await db.setConfig('trip_renewal_message',
`Trip Renew Notification

Please set your option to { LAST LOCATION }
then leave the current trip and rejoin the new one.

Host ID: {هوست}

We wish you all the best ❣️
|| @everyone ||`);

        await db.setConfig('trip_hurricane_message',
`Hurricane Warning Notification

⚠️ — There is a hurricane in the city. All players must
leave the trip and wait for future trips.

It was a great trip and we'll make it up to you next time.

We wish you all the best ❣️
|| @everyone ||`);

        console.log('✅ تم ضبط رسائل الرحلات');
    } catch (e) {
        console.error('❌ خطأ في ضبط رسائل الرحلات:', e.message);
    }

    setInterval(async () => {
        try {
            await db.updateAllJobPrices();
            console.log('✅ تم تحديث أسعار الوظائف تلقائياً');
        } catch (e) {
            console.error('❌ خطأ في تحديث أسعار الوظائف:', e.message);
        }
    }, 60 * 60 * 1000);

    // ── تذبذب أسعار الأسهم كل ساعة ─────────────────────────────────────
    setInterval(async () => {
        try {
            await db.applyRandomFluctuation();
            console.log('📈 تم تحديث أسعار الأسهم تلقائياً');
        } catch (e) {
            console.error('❌ خطأ في تحديث أسعار الأسهم:', e.message);
        }
    }, 60 * 60 * 1000);
});

const menuHandlers = {
    help_menu: {
        identity: '🪪 **Identity** — Type `/identity` to view your character and IBAN.',
        phone: '📱 **Phone** — Type `/phone` to send a police report 🚨 or ambulance report 🚑.',
        bag: '🎒 **Bag** — Type `/bag` to view your items. To transfer an item: `-نقل [item] @user`',
        bank: '🏦 **Bank** — Type `/bank` to view your balance and IBAN. To transfer money: `-تحويل [IBAN] [amount]`',
        trips: '✈️ **Trips** — Type `/الرحلات` to open a trip or send an Alert.',
        jobs: '💼 **Jobs** — Type `/jobs` to choose your job (fishing, taxi, hunting, mining).',
        market: '🛒 **Tools Market** — Type `/market` to buy a fishing rod, axe, or mining tools.',
        law: '⚖️ **Law** — Type `/law` to open a case or manage cases.',
        admin: '🛡️ **Admin** — Type `/admin` to view the admin dashboard.',
        crime: '🔫 **Crimes** — Type `/crime` to commit a crime.',
        tickets: '🎫 **Tickets** — Type `/tickets` to open a ticket (complaint, suggestion, report).',
        vehicles: '🚗 **Cars & Showroom**\n• `/سيارات` — Your registered cars\n• `/معارض` — View the showroom\n• `/اضافة-معرض` — Add a car to the showroom',
        sms: '💬 **Messages**\n• `-رسالة @user [text]` — Send a message\n• `-صندوق` — View your inbox\n• `-جهات @user [name]` — Add a contact\n• `-جهات` — View contacts',
        x_platform: '𝕏 **X Platform**\n• `-تغريد [text]` — Post a tweet\n• `/منصة-x` — View posts\n• `-حذف-تغريدة [number]` — Delete your tweet',
    },
    admin_menu: {
        ranks: '🏅 **View Ranks** — Contact Admin to view your current rank.',
        points: '⭐ **Admin Points** — Contact Admin to check your points.',
        manage: '👥 **Player Management** — Admin-only permission.',
        logs: '📋 **Action Log** — Log of all administrative actions.',
    },
    jobs_menu: {
        fishing: '🎣 **Fishing** — Head to the fishing area and start fishing.',
        taxi: '🚕 **Taxi** — Head to the taxi station and start working.',
        hunting: '🦌 **Hunting** — Head to the forest and start hunting.',
        mining: '⛏️ **Mining** — Head to the mine and start extracting minerals.',
    },
    law_menu: {
        new_case: '📁 **Open a Case** — Contact Admin to open a new case.',
        view_cases: '📋 **View Cases** — Contact Admin to view your cases.',
        hire_lawyer: '👨‍⚖️ **Hire a Lawyer** — Contact Admin to hire a lawyer.',
        legal_process: '⚖️ **Legal Procedures** — Contact Admin for information on legal procedures.',
    },
    market_menu: {
        fishing_rod: '🎣 **Fishing Rod** — Contact Admin to purchase a fishing rod.',
        axe: '🪓 **Axe** — Contact Admin to purchase an axe.',
        mining_tools: '⛏️ **Mining Tools** — Contact Admin to purchase mining tools.',
        auction: '🔨 **Auction** — Contact Admin to attend a car and property auction.',
    },
    health_menu: {
        hospital_resuscitation: '🏥 **Hospital Resuscitation** — Contact the hospital staff to revive you.',
        decay: '💀 **Decay** — Your character is in decay state. Contact Admin.',
        witch_resuscitation: '🧙 **Witch Resuscitation** — Contact the witch for a revival.',
    },
    ticket_menu: {
        complaint: '📋 **Complaint** — Write the details of your complaint and send it to management.',
        suggestion: '💡 **Suggestion** — Write your suggestion and it will be reviewed.',
        report: '🚨 **Report** — Write the details of the report with evidence and send it to management.',
        inquiry: '❓ **Inquiry** — Write your inquiry and you will receive a reply.',
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

async function sendToTripLog(embed) {
    try {
        const channelId = await db.getConfig('trip_log_channel');
        if (!channelId) return;
        const ch = await client.channels.fetch(channelId);
        if (ch) await ch.send({ embeds: [embed] });
    } catch (e) {
        console.error('trip log channel error:', e);
    }
}

async function handleOpenTicket(interaction, typeId) {
    try {
        const types = await db.getTicketTypes();
        const type  = types.find(t => t.name === String(typeId) || String(t.id) === String(typeId));
        if (!type) {
            // Panel is stale — auto-refresh it and ask user to try again
            try {
                const ticketCmd = client.commands.get('tickets');
                if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate().catch(() => {});
                if (ticketCmd?.buildPanel) {
                    const freshPayload = await ticketCmd.buildPanel(db);
                    await interaction.message.edit(freshPayload).catch(() => {});
                }
                await interaction.followUp({ content: '⚠️ The ticket menu was outdated and has been refreshed. Please select your ticket type again.', flags: 64 }).catch(() => {});
            } catch (e) {
                console.error('[TICKET] auto-refresh failed:', e);
                interaction.reply({ content: '❌ Please try again.', flags: 64 }).catch(() => {});
            }
            return;
        }

        const categoryId  = await db.getConfig('ticket_category_id');
        const cleanName   = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || `user${interaction.user.id.slice(-4)}`;
        const channelName = `ticket-${cleanName}`;

        const { PermissionFlagsBits: PFB, ChannelType, ActionRowBuilder: ARB2, ButtonBuilder: BB2, ButtonStyle: BS2 } = require('discord.js');

        const permOverwrites = [
            { id: interaction.guild.id,          deny:  [PFB.ViewChannel] },
            { id: interaction.user.id,            allow: [PFB.ViewChannel, PFB.SendMessages, PFB.ReadMessageHistory] },
            { id: interaction.client.user.id,     allow: [PFB.ViewChannel, PFB.SendMessages, PFB.ManageChannels] },
        ];
        if (type.role_id) {
            permOverwrites.push({ id: type.role_id, allow: [PFB.ViewChannel, PFB.SendMessages, PFB.ReadMessageHistory] });
        }

        const channelOptions = { name: channelName, type: ChannelType.GuildText, permissionOverwrites: permOverwrites };
        if (categoryId) channelOptions.parent = categoryId;

        const ticketChannel = await interaction.guild.channels.create(channelOptions);
        await db.createOpenTicket(interaction.user.id, ticketChannel.id, type.id, type.name);

        const receiverLine = type.role_id ? `\n🛡️ Assigned to: <@&${type.role_id}>` : '';
        const ticketEmbed  = new EmbedBuilder()
            .setTitle(`${type.emoji} Ticket — ${type.name}`)
            .setColor(0x1565C0)
            .setDescription(`Hello <@${interaction.user.id}>!\n\nYour **${type.emoji} ${type.name}** ticket has been opened successfully.${receiverLine}\n\nWhen done, press the **Close Ticket** button.`)
            .addFields({ name: '👤 Ticket Owner', value: `<@${interaction.user.id}>`, inline: true })
            .setFooter({ text: 'Ticket System • FANTASY Bot' }).setTimestamp();

        const closeRow = new ARB2().addComponents(
            new BB2().setCustomId(`claim_ticket_${ticketChannel.id}`).setLabel('Claim Ticket').setEmoji('📋').setStyle(BS2.Secondary),
            new BB2().setCustomId(`close_ticket_${ticketChannel.id}`).setLabel('Close Ticket').setEmoji('🔒').setStyle(BS2.Danger)
        );
        const pingContent = type.role_id ? `<@${interaction.user.id}> <@&${type.role_id}>` : `<@${interaction.user.id}>`;
        await ticketChannel.send({ content: pingContent, embeds: [ticketEmbed], components: [closeRow] });

        const ticketLogId = await db.getConfig('ticket_log_channel');
        if (ticketLogId) {
            const logCh = await client.channels.fetch(ticketLogId).catch(() => null);
            if (logCh) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('New Ticket Opened').setColor(0x2E7D32)
                    .addFields(
                        { name: '👤 User',    value: `<@${interaction.user.id}>`, inline: true },
                        { name: '🗂️ Type',   value: `${type.emoji} ${type.name}`,  inline: true },
                        { name: '📌 Channel', value: `<#${ticketChannel.id}>`,      inline: true },
                    ).setTimestamp();
                await logCh.send({ embeds: [logEmbed] });
            }
        }

        return interaction.reply({ content: `✅ Your ticket was opened in <#${ticketChannel.id}>`, flags: 64 });
    } catch (e) {
        console.error(e);
        if (!interaction.replied && !interaction.deferred)
            return interaction.reply({ content: '❌ An error occurred while creating the ticket.', flags: 64 }).catch(() => {});
    }
}

const resetCommandMap = {
    bank: 'بنك', bag: 'bag', identity: 'identity',
    phone: 'phone', الرحلات: 'الرحلات', jobs: 'jobs', market: 'market', 'بلاك-ماركت': 'بلاك-ماركت',
    law: 'محاماة', admin: 'admin', crime: 'crime', health: 'health',
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
    cia: 'cia',
};

client.on('interactionCreate', async interaction => {
    if (!markInteraction(interaction.id)) return;

    if (interaction.isButton()) {
        if (interaction.customId.startsWith('reset_')) {
            const key = interaction.customId.replace('reset_', '');
            const commandName = resetCommandMap[key];
            const command = commandName ? client.commands.get(commandName) : null;
            if (command?.slashExecute) {
                try {
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.deferUpdate();
                    }
                    interaction._isReset = true;
                    interaction.reply = async (data) => {
                        if (!data || data?.flags === 64 ||
                            data?.content === '\u200b' || data?.content === '​') return;
                        return interaction.editReply(data);
                    };
                    await command.slashExecute(interaction, db);
                } catch (e) {
                    if (e?.code === 40060 || e?.code === 10062) return;
                    console.error(e);
                    try {
                        if (interaction.deferred) interaction.editReply({ content: 'An error occurred.' });
                    } catch {}
                }
            } else {
                await interaction.deferUpdate().catch(() => {});
            }
            return;
        }

        if (interaction.customId.startsWith('trip_msg_btn_')) {
            const type   = interaction.customId.replace('trip_msg_btn_', '');
            const labels = { trip_start: 'Start Trip', trip_hurricane: 'Hurricane', trip_renewal: 'Renew' };
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder: ARB_TM } = require('discord.js');
            const placeholders = {
                trip_start:    'Variables: {هوست} {نائب} {رقابي} {وقت} {منظم}\nLeave blank to reset to default message',
                trip_renewal:  'Variables: {هوست} {منظم}\nLeave blank to reset to default message',
                trip_hurricane:'Leave blank to reset to default message',
            };
            const modal = new ModalBuilder()
                .setCustomId(`set_trip_msg_${type}`)
                .setTitle(`✏️ Message — ${labels[type] || type}`);
            modal.addComponents(
                new ARB_TM().addComponents(
                    new TextInputBuilder()
                        .setCustomId('trip_msg_text')
                        .setLabel('Message Text')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(false)
                        .setPlaceholder(placeholders[type] || 'Leave blank to reset to default message')
                )
            );
            return interaction.showModal(modal);
        }

        if (['trip_start', 'trip_hurricane', 'trip_renewal', 'trip_alert'].includes(interaction.customId)) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ This button is for admins only.', flags: 64 });
            }

            if (interaction.customId === 'trip_hurricane') {
                try { await interaction.deferReply({ flags: 64 }); } catch { return; }
                try {
                    const alertsChannelId = await db.getConfig('trips_alerts_channel');
                    if (!alertsChannelId) return interaction.editReply({ content: '❌ Alerts channel not configured. Use `/إعداد-رحلات` first.' });

                    await db.setConfig('hurricane_active', 'true');
                    await db.setConfig('trip_open', 'false');
                    await db.logoutAllUsers();
                    await db.addCharacterLog('system', 'system', 'hurricane_logout', 'All Players', 0, 'Hurricane — Automatic logout of all players');

                    const customMsg = await db.getConfig('trip_hurricane_message');
                    try {
                        const ch = await client.channels.fetch(alertsChannelId);
                        if (ch) {
                            if (customMsg) {
                                const hurricaneEmbed = new EmbedBuilder()
                                    .setTitle('Warning — Hurricane!')
                                    .setColor(0xB71C1C)
                                    .setDescription(customMsg)
                                    .setFooter({ text: 'Trip System • FANTASY Bot' })
                                    .setTimestamp();
                                await ch.send({ embeds: [hurricaneEmbed] });
                                sendToTripLog(hurricaneEmbed);
                            } else {
                                const hurricaneEmbed = new EmbedBuilder()
                                    .setTitle('Warning — Hurricane!')
                                    .setColor(0xB71C1C)
                                    .setDescription('⚠️ **The Hurricane event has been activated!**\n\n🚪 **All players** have been logged out automatically.\n✈️ **Login is suspended** until a new trip is opened.')
                                    .addFields({ name: '🔧 Activated by', value: `<@${interaction.user.id}>`, inline: true })
                                    .setFooter({ text: 'Trip System • FANTASY Bot' })
                                    .setTimestamp();
                                await ch.send({ embeds: [hurricaneEmbed] });
                                sendToTripLog(hurricaneEmbed);
                            }
                        }
                    } catch (sendErr) { console.error('[hurricane] send error:', sendErr?.message); }
                    return interaction.editReply({ content: '✅ Hurricane warning sent.' });
                } catch (e) {
                    console.error('[hurricane] error:', e?.message);
                    return interaction.editReply({ content: '❌ An error occurred.' });
                }
            }

            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder: ARB } = require('discord.js');

            if (interaction.customId === 'trip_start') {
                const modal = new ModalBuilder().setCustomId('trip_start_modal').setTitle('Start New Trip');
                modal.addComponents(
                    new ARB().addComponents(new TextInputBuilder().setCustomId('trip_host_id').setLabel('Host ID').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ARB().addComponents(new TextInputBuilder().setCustomId('trip_deputy').setLabel('Co-Pilot / Deputy').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ARB().addComponents(new TextInputBuilder().setCustomId('trip_supervisor').setLabel('Observer').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ARB().addComponents(new TextInputBuilder().setCustomId('trip_time').setLabel('Trip Time').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Example: 9:00 PM')),
                );
                return interaction.showModal(modal).catch(() => {});
            }

            if (interaction.customId === 'trip_renewal') {
                const tripOpen       = await db.getConfig('trip_open');
                const hurricaneActive = await db.getConfig('hurricane_active');

                if (hurricaneActive === 'true') {
                    return interaction.reply({ content: '⚠️ An active Hurricane is in effect — Renew is not possible. Please open a new trip first via the **Start Trip** button.', flags: 64 });
                }

                if (tripOpen !== 'true') {
                    return interaction.reply({ content: '❌ No trip is currently open — you must Start Trip first before Renewing.', flags: 64 });
                }

                const modal = new ModalBuilder().setCustomId('trip_renewal_modal').setTitle('Trip Renewal');
                modal.addComponents(
                    new ARB().addComponents(new TextInputBuilder().setCustomId('renewal_host_id').setLabel('Host ID').setStyle(TextInputStyle.Short).setRequired(true)),
                );
                return interaction.showModal(modal).catch(() => {});
            }

            if (interaction.customId === 'trip_alert') {
                const modal = new ModalBuilder().setCustomId('trip_alert_modal').setTitle('Send Alert');
                modal.addComponents(
                    new ARB().addComponents(new TextInputBuilder().setCustomId('alert_text').setLabel('Alert Text').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                );
                return interaction.showModal(modal).catch(() => {});
            }
        }


        if (interaction.customId.startsWith('do_job_')) {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const loginErr = await db.checkLoginAndIdentity(interaction.user.id);
                if (loginErr) return interaction.reply({ content: loginErr, flags: 64 });

                const jobKey = interaction.customId.replace('do_job_', '');
                const JOBS = {
                    fishing:     { label: '🎣 Fishing',    req: 'سنارة',       items: ['Grouper Fish','Salmon','Shrimp','Whale'], weights: [20,35,40,5], color: 0x1565C0 },
                    woodcutting: { label: '🪓 Woodcutting', req: 'فأس',         items: ['Wood'],                                   weights: [100],       color: 0x4E342E },
                    mining:      { label: '⛏️ Mining',      req: 'أدوات المنجم', items: ['Diamond','Gold','Silver','Copper'],       weights: [5,20,35,40], color: 0x546E7A },
                };
                const job = JOBS[jobKey];
                if (!job) return;

                const hasReq = await db.hasItem(interaction.user.id, job.req);
                if (!hasReq)
                    return interaction.reply({ content: `❌ You need **${job.req}** in your bag to perform this job.`, flags: 64 });

                const { COOLDOWN_MINUTES } = require('./commands/jobs');
                const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
                const lastUsed   = await db.getJobCooldown(interaction.user.id, jobKey);
                if (lastUsed) {
                    const elapsed = Date.now() - new Date(lastUsed).getTime();
                    if (elapsed < cooldownMs) {
                        const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
                        return interaction.reply({ content: `⏳ You must wait **${remaining} seconds** before performing this job again.`, flags: 64 });
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
                    .setTitle(`${job.label} — Result`)
                    .setColor(job.color)
                    .setDescription(`You obtained **${qty} ${obtained}** 🎉`)
                    .addFields(
                        { name: '📦 Loot',               value: `${qty}× ${obtained}`,                        inline: true },
                        { name: '💹 Unit Price',          value: `${unitPrice.toLocaleString()} Riyals`,       inline: true },
                        { name: '💰 Estimated Value',     value: `${estValue.toLocaleString()} Riyals`,        inline: true },
                        { name: '🎒 Added to',            value: 'Your bag',                                   inline: true },
                        { name: '⏳ Cooldown',             value: '10 seconds',                                 inline: true },
                    )
                    .setFooter({ text: 'Jobs System • FANTASY Bot — sell your earnings via the jobs menu' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId.startsWith('buy_bm_')) {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const itemId = parseInt(interaction.customId.replace('buy_bm_', ''));
                const item   = await db.getBlackMarketItemById(itemId);
                if (!item) return interaction.reply({ content: '❌ This item is no longer available.', flags: 64 });

                const identity = await db.getActiveIdentity(interaction.user.id);
                if (!identity) return interaction.reply({ content: 'You are not logged in. Please log in first.', flags: 64 });

                const cash = Number(identity.cash);
                if (cash < item.price) return interaction.reply({ content: `❌ Insufficient cash. You need **${Number(item.price).toLocaleString('en-US')}$** and you have **${cash.toLocaleString('en-US')}$**.`, flags: 64 });

                await db.addToCash(interaction.user.id, identity.slot, -item.price);
                await db.addItem(interaction.user.id, item.name, 1);

                const embed = new EmbedBuilder()
                    .setTitle('Purchase Complete')
                    .setColor(0x1a1a2e)
                    .setDescription(`**${item.name}** was successfully purchased and added to your bag.`)
                    .addFields(
                        { name: '🛒 Item',             value: item.name,                                                    inline: true },
                        { name: '💸 Amount Paid',       value: `${Number(item.price).toLocaleString('en-US')}$`,           inline: true },
                        { name: '💰 Remaining Balance', value: `${(cash - item.price).toLocaleString('en-US')}$`,          inline: true },
                    )
                    .setFooter({ text: 'Black Market • FANTASY Bot' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId.startsWith('buy_market_')) {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const itemId   = parseInt(interaction.customId.replace('buy_market_', ''));
                const item     = await db.getMarketItemById(itemId);
                if (!item) return interaction.reply({ content: '❌ This item is no longer available.', flags: 64 });

                const identity = await db.getActiveIdentity(interaction.user.id);
                if (!identity) return interaction.reply({ content: 'You are not logged in. Please log in first.', flags: 64 });

                const cash = Number(identity.cash);
                if (cash < item.price)
                    return interaction.reply({ content: `❌ Insufficient cash. You need **${Number(item.price).toLocaleString()} Riyals** and you have **${cash.toLocaleString()} Riyals**.`, flags: 64 });

                await db.addToCash(interaction.user.id, identity.slot, -item.price);
                await db.addItem(interaction.user.id, item.name, 1);

                const embed = new EmbedBuilder()
                    .setTitle('Purchase Complete')
                    .setColor(0xBF360C)
                    .setDescription(`**${item.name}** was successfully purchased and added to your bag.`)
                    .addFields(
                        { name: '🛒 Item',             value: item.name,                                            inline: true },
                        { name: '💸 Amount Paid',       value: `${Number(item.price).toLocaleString()} Riyals`,    inline: true },
                        { name: '💵 Remaining Cash',    value: `${(cash - item.price).toLocaleString()} Riyals`,   inline: true },
                    )
                    .setFooter({ text: 'Store System • FANTASY Bot' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId.startsWith('buy_equipment_')) {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const itemId   = parseInt(interaction.customId.replace('buy_equipment_', ''));
                const item     = await db.getEquipmentItemById(itemId);
                if (!item) return interaction.reply({ content: '❌ This equipment is no longer available.', flags: 64 });

                const identity = await db.getActiveIdentity(interaction.user.id);
                if (!identity) return interaction.reply({ content: 'You are not logged in. Please log in first.', flags: 64 });

                const cash = Number(identity.cash);
                if (cash < item.price)
                    return interaction.reply({ content: `❌ Insufficient cash. You need **${Number(item.price).toLocaleString()} Riyals** and you have **${cash.toLocaleString()} Riyals**.`, flags: 64 });

                await db.addToCash(interaction.user.id, identity.slot, -item.price);
                await db.addItem(interaction.user.id, item.name, 1);

                const embed = new EmbedBuilder()
                    .setTitle('Purchase Complete')
                    .setColor(0x4527A0)
                    .setDescription(`**${item.name}** was successfully purchased and added to your bag.`)
                    .addFields(
                        { name: '🔨 Equipment',         value: item.name,                                            inline: true },
                        { name: '💸 Amount Paid',        value: `${Number(item.price).toLocaleString()} Riyals`,    inline: true },
                        { name: '💵 Remaining Cash',     value: `${(cash - item.price).toLocaleString()} Riyals`,   inline: true },
                    )
                    .setFooter({ text: 'Equipment Store • FANTASY Bot' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId.startsWith('buy_property_')) {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const propId = parseInt(interaction.customId.replace('buy_property_', ''));
                const prop   = await db.getPropertyById(propId);
                if (!prop) return interaction.reply({ content: '❌ This property is no longer available.', flags: 64 });

                const identity = await db.getActiveIdentity(interaction.user.id);
                if (!identity) return interaction.reply({ content: '❌ Your active identity was not found.', flags: 64 });

                const price = Number(prop.price);
                if (Number(identity.cash) < price) {
                    return interaction.reply({
                        content: `❌ Insufficient cash. You have \`${Number(identity.cash).toLocaleString()} Riyals\` and the property costs \`${price.toLocaleString()} Riyals\`.`,
                        flags: 64
                    });
                }

                // deduct from cash
                await db.addToCash(interaction.user.id, identity.slot, -price);

                // DM the buyer with property details
                const dmEmbed = new EmbedBuilder()
                    .setTitle(`🏠 Property Purchased — ${prop.name}`)
                    .setColor(0x2E7D32)
                    .addFields(
                        { name: '🏠 Property Name', value: prop.name, inline: true },
                        { name: '💰 Amount Paid',   value: `\`${price.toLocaleString()} Riyals\``, inline: true },
                    )
                    .setDescription('> Congratulations! Your property was successfully purchased. Keep this message as your ownership document.')
                    .setFooter({ text: 'Properties System • FANTASY Bot' })
                    .setTimestamp();
                if (prop.image_url) dmEmbed.setImage(prop.image_url);

                try {
                    const user = await client.users.fetch(interaction.user.id);
                    await user.send({ embeds: [dmEmbed] });
                } catch {
                    // DMs disabled — ignore
                }

                const successEmbed = new EmbedBuilder()
                    .setTitle('Purchase Complete')
                    .setColor(0x2E7D32)
                    .addFields(
                        { name: '🏠 Property',     value: prop.name, inline: true },
                        { name: '💰 Amount Paid',  value: `\`${price.toLocaleString()} Riyals\``, inline: true },
                    )
                    .setDescription('> The amount has been deducted from your cash and an ownership document has been sent to your DMs.')
                    .setFooter({ text: 'Properties System • FANTASY Bot' })
                    .setTimestamp();
                return interaction.update({ embeds: [successEmbed], components: [] });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred during the purchase.', flags: 64 });
            }
        }

        if (interaction.customId === 'confirm_delete_all_identities' || interaction.customId === 'cancel_delete_all_identities') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ This command is for admins only.', flags: 64 });
            }
            if (interaction.customId === 'cancel_delete_all_identities') {
                return interaction.update({ content: '❌ Operation cancelled.', embeds: [], components: [] });
            }
            try {
                await db.deleteAllIdentities();
                const doneEmbed = new EmbedBuilder()
                    .setTitle('All Identities Deleted')
                    .setColor(0x757575)
                    .setDescription('> All identities and pending requests have been successfully deleted, and all accounts have been logged out.')
                    .setFooter({ text: 'FANTASY Bot • Identity System' })
                    .setTimestamp();
                return interaction.update({ embeds: [doneEmbed], components: [] });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred while deleting identities.', flags: 64 });
            }
        }

        if (interaction.customId.startsWith('approve_identity_') || interaction.customId.startsWith('reject_identity_')) {
            const isApprove = interaction.customId.startsWith('approve_identity_');
            const pendingId  = parseInt(interaction.customId.replace(isApprove ? 'approve_identity_' : 'reject_identity_', ''));
            try {
                const adminRole = await db.getConfig('identity_admin_role');
                if (adminRole && !interaction.member.roles.cache.has(adminRole)) {
                    return interaction.reply({ content: '❌ You do not have permission to manage player identities.', flags: 64 });
                }
                const pending = await db.getPendingIdentity(pendingId);
                if (!pending) return interaction.reply({ content: '❌ Request not found or already processed.', flags: 64 });

                if (isApprove) {
                    const char = await db.createIdentityFull(pending.discord_id, pending.slot, {
                        charName: pending.char_name, familyName: pending.family_name,
                        birthPlace: pending.birth_place, birthDate: pending.birth_date, gender: pending.gender
                    });
                    await db.updatePendingStatus(pendingId, 'approved');
                    await db.addCharacterLog(pending.discord_id, pending.username, 'approved', pending.char_name, pending.slot, `Approved by: ${interaction.user.username}`);

                    const resultEmbed = new EmbedBuilder()
                        .setTitle('Identity Request Accepted')
                        .setColor(0x2E7D32)
                        .addFields(
                            { name: '👤 User',      value: `<@${pending.discord_id}>`, inline: true },
                            { name: '📋 Character', value: `Character ${pending.slot}: **${pending.char_name} ${pending.family_name}**`, inline: true },
                            { name: '✅ Approved by', value: `<@${interaction.user.id}>`, inline: true },
                            { name: '🏦 IBAN', value: `\`${char.iban}\``, inline: true },
                        )
                        .setFooter({ text: 'Identity System • FANTASY Bot' }).setTimestamp();
                    sendToCharLog(resultEmbed);
                    await interaction.update({ embeds: [resultEmbed], components: [] });

                    try {
                        const identityRoleId = await db.getConfig('identity_role');
                        if (identityRoleId) {
                            const member = await interaction.guild.members.fetch(pending.discord_id);
                            await member.roles.add(identityRoleId);
                        }
                    } catch {}

                    try {
                        const user = await client.users.fetch(pending.discord_id);
                        const slotNamesApprove = { 1: 'Character 1', 2: 'Character 2', 3: 'Character 3' };
                        const approveDmEmbed = new EmbedBuilder()
                            .setTitle('Your Identity Request Accepted!')
                            .setColor(0x2E7D32)
                            .setDescription('Congratulations! Your identity has been approved. You can now log in.')
                            .addFields(
                                { name: '📌 Character',   value: slotNamesApprove[pending.slot] || `Character ${pending.slot}`, inline: true },
                                { name: '👤 Full Name',   value: `${pending.char_name} ${pending.family_name}`, inline: true },
                                { name: '⚧ Gender',       value: pending.gender || '—', inline: true },
                                { name: '📅 Birth Date',  value: pending.birth_date || '—', inline: true },
                                { name: '📍 Birth Place', value: pending.birth_place || '—', inline: true },
                                { name: '🏦 Your IBAN',   value: `\`${char.iban}\``, inline: true },
                            )
                            .setFooter({ text: 'FANTASY Bot • Identity System' })
                            .setTimestamp();
                        await user.send({ embeds: [approveDmEmbed] });
                    } catch {}
                } else {
                    await db.updatePendingStatus(pendingId, 'rejected');
                    await db.addCharacterLog(pending.discord_id, pending.username, 'rejected', pending.char_name, pending.slot, `Rejected by: ${interaction.user.username}`);

                    const resultEmbed = new EmbedBuilder()
                        .setTitle('Identity Request Rejected')
                        .setColor(0xB71C1C)
                        .addFields(
                            { name: '👤 User',        value: `<@${pending.discord_id}>`, inline: true },
                            { name: '📋 Character',   value: `Character ${pending.slot}: **${pending.char_name} ${pending.family_name}**`, inline: true },
                            { name: '❌ Rejected by', value: `<@${interaction.user.id}>`, inline: true },
                        )
                        .setFooter({ text: 'Identity System • FANTASY Bot' }).setTimestamp();
                    sendToCharLog(resultEmbed);
                    await interaction.update({ embeds: [resultEmbed], components: [] });

                    try {
                        const user = await client.users.fetch(pending.discord_id);
                        const slotNamesReject = { 1: 'Character 1', 2: 'Character 2', 3: 'Character 3' };
                        const dmEmbed = new EmbedBuilder()
                            .setTitle('Identity Request Rejected')
                            .setColor(0xB71C1C)
                            .setDescription('Unfortunately, your identity creation request has been rejected. You can try again or contact Admin.')
                            .addFields(
                                { name: '📌 Character',       value: slotNamesReject[pending.slot] || `Character ${pending.slot}`, inline: true },
                                { name: '🪪 Submitted Name',  value: `${pending.char_name} ${pending.family_name}`, inline: true },
                                { name: '❌ Rejected by',     value: interaction.user.username, inline: true },
                            )
                            .setFooter({ text: 'FANTASY Bot • Identity System' })
                            .setTimestamp();
                        await user.send({ embeds: [dmEmbed] });
                    } catch {}
                }
            } catch (e) {
                console.error(e);
                if (!interaction.replied && !interaction.deferred) interaction.reply({ content: 'An error occurred.', flags: 64 });
            }
            return;
        }

        if (interaction.customId.startsWith('approve_company_') || interaction.customId.startsWith('reject_company_')) {
            const isApprove = interaction.customId.startsWith('approve_company_');
            const pendingId = parseInt(interaction.customId.replace(isApprove ? 'approve_company_' : 'reject_company_', ''));
            try {
                const ministryRoleId = await db.getConfig('trade_ministry_role');
                const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
                const hasMinistryRole = ministryRoleId && interaction.member.roles.cache.has(ministryRoleId);
                if (!isAdmin && !hasMinistryRole)
                    return interaction.reply({ content: '❌ This button is for Ministry of Commerce admins only.', flags: 64 });

                const pending = await db.getPendingCompany(pendingId);
                if (!pending)
                    return interaction.reply({ content: '❌ Request not found.', flags: 64 });
                if (pending.status !== 'pending')
                    return interaction.reply({ content: '❌ This request has already been processed.', flags: 64 });

                if (isApprove) {
                    const result = await db.createCompany(pending.company_name, pending.discord_id);
                    if (result.error) {
                        await db.updatePendingCompanyStatus(pendingId, 'rejected', interaction.user.id);
                        const failEmbed = new EmbedBuilder()
                            .setTitle('Company Establishment Failed')
                            .setColor(0xB71C1C)
                            .setDescription(`Reason: ${result.error}`)
                            .addFields(
                                { name: '👤 Applicant', value: `<@${pending.discord_id}>`, inline: true },
                                { name: '🏢 Company',   value: pending.company_name, inline: true },
                            )
                            .setFooter({ text: 'Ministry of Commerce • FANTASY Bot' }).setTimestamp();
                        return interaction.update({ embeds: [failEmbed], components: [] });
                    }

                    await db.updatePendingCompanyStatus(pendingId, 'approved', interaction.user.id);

                    // ── تسجيل الشركة تلقائياً في سوق الأسهم ──
                    try {
                        await db.listCompanyOnMarket(result.company.id, 100, 1000);
                        console.log(`[STOCK] تم إدراج شركة "${pending.company_name}" (ID: ${result.company.id}) في سوق الأسهم.`);
                    } catch (stockErr) {
                        console.error('[STOCK LIST ERROR]', stockErr);
                    }

                    // ── إنشاء Rank مالك الشركة وتعيينها تلقائياً ──
                    let ownerRoleMention = '';
                    try {
                        const ownerRole = await interaction.guild.roles.create({
                            name: `Owner — ${pending.company_name}`,
                            color: 0x1565C0,
                            reason: `Company establishment: ${pending.company_name}`,
                        });
                        const ownerMember = await interaction.guild.members.fetch(pending.discord_id);
                        await ownerMember.roles.add(ownerRole);
                        ownerRoleMention = ` — Role ${ownerRole} assigned`;
                    } catch (roleErr) {
                        console.error('[OWNER ROLE CREATE ERROR]', roleErr);
                    }

                    const approveEmbed = new EmbedBuilder()
                        .setTitle('Establishment Request Accepted')
                        .setColor(0x1B5E20)
                        .addFields(
                            { name: '👤 Applicant',    value: `<@${pending.discord_id}>`, inline: true },
                            { name: '🏢 Company',      value: `**${pending.company_name}**`, inline: true },
                            { name: '✅ Approved by',  value: `<@${interaction.user.id}>`, inline: true },
                        )
                        .setDescription(ownerRoleMention || null)
                        .setFooter({ text: 'Ministry of Commerce • FANTASY Bot' }).setTimestamp();
                    await interaction.update({ embeds: [approveEmbed], components: [] });

                    try {
                        const user = await client.users.fetch(pending.discord_id);
                        const dmEmbed = new EmbedBuilder()
                            .setTitle('Company Establishment Approved!')
                            .setColor(0x1B5E20)
                            .setDescription(`Congratulations, you are now one of Fantasy Town's traders, and we wish you success! 🎉\n\nCompany **${pending.company_name}** has been successfully established. You can now manage it via \`/شركة\`.`)
                            .setFooter({ text: 'Ministry of Commerce • FANTASY Bot' }).setTimestamp();
                        await user.send({ embeds: [dmEmbed] });
                    } catch {}
                } else {
                    await db.updatePendingCompanyStatus(pendingId, 'rejected', interaction.user.id);

                    const rejectEmbed = new EmbedBuilder()
                        .setTitle('Establishment Request Rejected')
                        .setColor(0xB71C1C)
                        .addFields(
                            { name: '👤 Applicant',    value: `<@${pending.discord_id}>`, inline: true },
                            { name: '🏢 Company',      value: pending.company_name, inline: true },
                            { name: '❌ Rejected by',  value: `<@${interaction.user.id}>`, inline: true },
                        )
                        .setFooter({ text: 'Ministry of Commerce • FANTASY Bot' }).setTimestamp();
                    await interaction.update({ embeds: [rejectEmbed], components: [] });

                    try {
                        const user = await client.users.fetch(pending.discord_id);
                        const dmEmbed = new EmbedBuilder()
                            .setTitle('Your Company Establishment Request Rejected')
                            .setColor(0xB71C1C)
                            .setDescription(`Unfortunately, the establishment request for company **${pending.company_name}** has been rejected.\nYou can contact the Ministry of Commerce for more details.`)
                            .setFooter({ text: 'Ministry of Commerce • FANTASY Bot' }).setTimestamp();
                        await user.send({ embeds: [dmEmbed] });
                    } catch {}
                }
            } catch (e) {
                console.error('[COMPANY APPROVE/REJECT ERROR]', e);
                if (!interaction.replied && !interaction.deferred) interaction.reply({ content: 'An error occurred.', flags: 64 });
            }
            return;
        }

        // ── أزرار وزارة التجارة ──────────────────────────────────────────────────
        if (['ministry_login_btn','ministry_logout_btn','ministry_companies_btn','ministry_approve_btn'].includes(interaction.customId)) {
            try {
                const ministryRoleId = await db.getConfig('trade_ministry_role');
                const isAdminUser = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
                const hasMinistryRole = ministryRoleId && interaction.member.roles.cache.has(ministryRoleId);

                // تسجيل الدخول والخروج: Rank الوزارة فقط بدون استثناء الأدمن
                if (['ministry_login_btn', 'ministry_logout_btn'].includes(interaction.customId)) {
                    if (!hasMinistryRole)
                        return interaction.reply({ content: '❌ Login and logout is for Ministry of Commerce staff only.', flags: 64 });
                } else {
                    if (!isAdminUser && !hasMinistryRole)
                        return interaction.reply({ content: '❌ This action is for Ministry of Commerce staff only.', flags: 64 });
                }

                // ─── Login ───────────────────────────────────────────────
                if (interaction.customId === 'ministry_login_btn') {
                    const duty = await db.getMinistryDuty(interaction.user.id);
                    if (duty?.status === 'on')
                        return interaction.reply({ content: '⚠️ You are already logged in.', flags: 64 });
                    await db.setMinistryDuty(interaction.user.id, 'on');
                    const ministryChId = await db.getConfig('trade_ministry_channel');
                    if (ministryChId) {
                        const ch = interaction.guild.channels.cache.get(ministryChId);
                        if (ch) await ch.send({
                            embeds: [new EmbedBuilder()
                                .setTitle('Login — Ministry of Commerce')
                                .setColor(0x1B5E20)
                                .addFields({ name: '👤 Staff', value: `<@${interaction.user.id}>`, inline: true })
                                .setTimestamp()]
                        });
                    }
                    return interaction.reply({ content: '✅ You have successfully logged in.', flags: 64 });
                }

                // ─── Logout ───────────────────────────────────────────────
                if (interaction.customId === 'ministry_logout_btn') {
                    const duty = await db.getMinistryDuty(interaction.user.id);
                    if (!duty || duty.status === 'off')
                        return interaction.reply({ content: '⚠️ You are not currently logged in.', flags: 64 });
                    await db.setMinistryDuty(interaction.user.id, 'off');
                    const ministryChId = await db.getConfig('trade_ministry_channel');
                    if (ministryChId) {
                        const ch = interaction.guild.channels.cache.get(ministryChId);
                        if (ch) await ch.send({
                            embeds: [new EmbedBuilder()
                                .setTitle('Logout — Ministry of Commerce')
                                .setColor(0xB71C1C)
                                .addFields({ name: '👤 Staff', value: `<@${interaction.user.id}>`, inline: true })
                                .setTimestamp()]
                        });
                    }
                    return interaction.reply({ content: '✅ You have successfully logged out.', flags: 64 });
                }

                // ─── View Registered Companies ──────────────────────────────────────
                if (interaction.customId === 'ministry_companies_btn') {
                    const companies = await db.getAllCompanies();
                    if (!companies.length)
                        return interaction.reply({ content: '📋 No registered companies found.', flags: 64 });

                    const list = companies.map((c, i) =>
                        `**${i + 1}.** ${c.name} — Owner: <@${c.owner_discord_id}> — Balance: \`${(c.balance || 0).toLocaleString()} Riyals\``
                    ).join('\n');

                    const embed = new EmbedBuilder()
                        .setTitle(`🏢 Registered Companies (${companies.length})`)
                        .setColor(0x1565C0)
                        .setDescription(list)
                        .setFooter({ text: 'Ministry of Commerce • FANTASY Bot' })
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }

                if (interaction.customId === 'ministry_approve_btn') {
                    const pending = await db.getAllPendingCompanies();
                    if (!pending.length)
                        return interaction.reply({ content: '📋 No pending company requests at the moment.', flags: 64 });

                    for (const p of pending) {
                        const embed = new EmbedBuilder()
                            .setTitle(`📋 Company Establishment Request #${p.id}`)
                            .setColor(0xF57F17)
                            .addFields(
                                { name: '👤 Applicant',         value: `<@${p.discord_id}>`, inline: true },
                                { name: '🏢 Company Name',      value: p.company_name, inline: true },
                                { name: '📝 Personal Info',     value: p.personal_info || '—', inline: false },
                                { name: '🏗️ Company Details',   value: p.company_details || '—', inline: false },
                                { name: '📊 Management Plan',   value: p.management_plan || '—', inline: false },
                                { name: '💰 Financial Info',    value: p.financial_info || '—', inline: false },
                            )
                            .setFooter({ text: `Ministry of Commerce • FANTASY Bot` })
                            .setTimestamp();

                        const row = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId(`approve_company_${p.id}`).setLabel('Approve').setEmoji('✅').setStyle(ButtonStyle.Success),
                            new ButtonBuilder().setCustomId(`reject_company_${p.id}`).setLabel('Reject').setEmoji('❌').setStyle(ButtonStyle.Danger),
                        );
                        await interaction.channel.send({ embeds: [embed], components: [row] });
                    }
                    return interaction.reply({ content: `📨 **${pending.length}** pending request(s) shown above.`, flags: 64 });
                }
            } catch (e) {
                console.error('[MINISTRY BTN ERROR]', e);
                if (!interaction.replied) interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
            return;
        }

        // ── CIA: Login / خروج / كشف مباشرين ────────────────────────────────
        if (['cia_login_btn','cia_logout_btn','cia_active_btn','cia_fake_id_btn'].includes(interaction.customId)) {
            try {
                const ciaMemberRoleId = await db.getConfig('cia_member_role');
                const ciaChefRoleId   = await db.getConfig('cia_chef_role');
                const hasCiaAccess =
                    (ciaMemberRoleId && interaction.member.roles.cache.has(ciaMemberRoleId)) ||
                    (ciaChefRoleId   && interaction.member.roles.cache.has(ciaChefRoleId));
                if (!hasCiaAccess)
                    return interaction.reply({ content: '🔒 This button is for CIA members only.', flags: 64 });

                // ─── Login ──────────────────────────────────────────────
                if (interaction.customId === 'cia_login_btn') {
                    const duty = await db.getCiaDuty(interaction.user.id);
                    if (duty?.status === 'on')
                        return interaction.reply({ content: '⚠️ You are already logged in.', flags: 64 });
                    await db.setCiaDuty(interaction.user.id, 'on');
                    const embed = new EmbedBuilder()
                        .setTitle('CIA — Login')
                        .setColor(0x1B5E20)
                        .addFields({ name: '🕵️ Member', value: `<@${interaction.user.id}>`, inline: true })
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }

                // ─── Logout ──────────────────────────────────────────────
                if (interaction.customId === 'cia_logout_btn') {
                    const duty = await db.getCiaDuty(interaction.user.id);
                    if (!duty || duty.status === 'off')
                        return interaction.reply({ content: '⚠️ You are not currently logged in.', flags: 64 });
                    await db.setCiaDuty(interaction.user.id, 'off');
                    const embed = new EmbedBuilder()
                        .setTitle('CIA — Logout')
                        .setColor(0xB71C1C)
                        .addFields({ name: '🕵️ Member', value: `<@${interaction.user.id}>`, inline: true })
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }

                // ─── هوية مزيفة — فتح مودال (CIA Chef فقط) ──────────────────────
                if (interaction.customId === 'cia_fake_id_btn') {
                    if (!ciaChefRoleId || !interaction.member.roles.cache.has(ciaChefRoleId))
                        return interaction.reply({ content: '🔒 Creating fake IDs is for CIA Chief only.', flags: 64 });

                    const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
                    const modal = new ModalBuilder()
                        .setCustomId('cia_fake_id_modal')
                        .setTitle('Create Fake ID');

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('fake_target')
                                .setLabel('Mention or ID of the target')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('@username or 123456789')
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('fake_name')
                                .setLabel('Fake Name')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('Example: John Smith')
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('fake_duration')
                                .setLabel('Expiry Duration')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('Example: 30m or 2h or 1d or 7d')
                                .setRequired(true)
                        )
                    );
                    return interaction.showModal(modal);
                }

                // ─── كشف المباشرين (CIA Chef فقط) ───────────────────────────────
                if (interaction.customId === 'cia_active_btn') {
                    if (!ciaChefRoleId || !interaction.member.roles.cache.has(ciaChefRoleId))
                        return interaction.reply({ content: '🔒 Viewing active members is for CIA Chief only.', flags: 64 });

                    const active = await db.getAllActiveCia();
                    if (!active.length)
                        return interaction.reply({ content: '📭 No CIA members are currently active.', flags: 64 });

                    let desc = '';
                    for (const row of active) {
                        const since = Math.floor(new Date(row.updated_at).getTime() / 1000);
                        desc += `🕵️ <@${row.discord_id}> — since <t:${since}:R>\n`;
                    }
                    const embed = new EmbedBuilder()
                        .setTitle(`👥 CIA — Currently Active (${active.length})`)
                        .setColor(0x0D1B2A)
                        .setDescription(desc)
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }
            } catch (e) {
                console.error('[CIA DUTY ERROR]', e);
                if (!interaction.replied) interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
            return;
        }

        if (interaction.customId === 'security_files_btn') {
            try {
                const ciaRoleId = await db.getConfig('cia_chef_role');
                if (ciaRoleId && !interaction.member.roles.cache.has(ciaRoleId))
                    return interaction.reply({ content: '🔒 This button is for CIA members only.', flags: 64 });

                await interaction.deferReply({ flags: 64 });
                const ministryRoleId = await db.getConfig('trade_ministry_role');
                const allIdentities = await db.getAllActiveIdentities();

                if (!allIdentities.length) {
                    return interaction.editReply({ content: '📭 No registered citizens found.' });
                }

                const filtered = [];
                for (const id of allIdentities) {
                    if (ministryRoleId) {
                        const member = await interaction.guild.members.fetch(id.discord_id).catch(() => null);
                        if (member && member.roles.cache.has(ministryRoleId)) continue;
                    }
                    const violation = await db.getViolationByUserId(id.discord_id);
                    filtered.push({ ...id, violation });
                }

                if (!filtered.length) {
                    return interaction.editReply({ content: '📭 No citizens found after excluding staff.' });
                }

                const CHUNK = 10;
                const embeds = [];
                for (let i = 0; i < filtered.length; i += CHUNK) {
                    const slice = filtered.slice(i, i + CHUNK);
                    const embed = new EmbedBuilder()
                        .setTitle(`📋 Citizen Files — ${i + 1} to ${Math.min(i + CHUNK, filtered.length)} of ${filtered.length}`)
                        .setColor(0x1A237E)
                        .setTimestamp();

                    let desc = '';
                    for (const p of slice) {
                        const fullName = [p.character_name, p.family_name].filter(Boolean).join(' ');
                        const sawa = p.violation
                            ? `⚠️ **${p.violation.reason}** (expires: <t:${Math.floor(new Date(p.violation.expires_at).getTime() / 1000)}:R>)`
                            : '✅ No prior violations';
                        desc += `👤 **${fullName}**\n🪪 IBAN: \`${p.iban}\`\n📌 Violations: ${sawa}\n\n`;
                    }
                    embed.setDescription(desc.slice(0, 4000));
                    embeds.push(embed);
                }

                await interaction.editReply({ embeds: embeds.slice(0, 10) });
            } catch (e) {
                console.error('[SECURITY FILES ERROR]', e);
                if (!interaction.replied) interaction.editReply({ content: '❌ An error occurred.' });
            }
            return;
        }

        // ── تراكينق — فتح مودال ──────────────────────────────────────────────────
        if (interaction.customId === 'tracking_btn') {
            const ciaRoleId = await db.getConfig('cia_chef_role');
            if (ciaRoleId && !interaction.member.roles.cache.has(ciaRoleId))
                return interaction.reply({ content: '🔒 This button is for CIA members only.', flags: 64 });

            const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
            const modal = new ModalBuilder()
                .setCustomId('tracking_modal')
                .setTitle('Tracking');
            const input = new TextInputBuilder()
                .setCustomId('tracking_target')
                .setLabel('Mention or ID of the target')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('@username or 123456789')
                .setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            await interaction.showModal(modal);
            return;
        }

        // ── تفعيل / رفض طلب التفعيل ───────────────────────────────────────────
        if (interaction.customId.startsWith('activate_approve_') || interaction.customId.startsWith('activate_reject_')) {
            const isApprove = interaction.customId.startsWith('activate_approve_');
            const reqId = parseInt(interaction.customId.replace(isApprove ? 'activate_approve_' : 'activate_reject_', ''));
            try {
                const { isAdmin } = require('./utils');
                if (!(await isAdmin(interaction.member, db)))
                    return interaction.reply({ content: '❌ Admins only.', flags: 64 });

                const req = await db.getActivationRequest(reqId);
                if (!req) return interaction.update({ content: '❌ Request not found or already processed.', embeds: [], components: [] });

                if (isApprove) {
                    // منح Rank التفعيل وتعيين النيك نيم بـ ID سوني
                    try {
                        const roleId = await db.getConfig('activation_role_id');
                        const member = await interaction.guild.members.fetch(req.user_id).catch(() => null);
                        if (member) {
                            if (roleId) await member.roles.add(roleId).catch(() => {});
                            await member.setNickname(req.sony_id).catch(() => {});
                        }
                    } catch (_) {}

                    const approveEmbed = new EmbedBuilder()
                        .setTitle('Activation Request Accepted')
                        .setColor(0x2E7D32)
                        .addFields(
                            { name: '👤 Player',      value: `<@${req.user_id}>`,  inline: true },
                            { name: '🎮 Sony ID',     value: `\`${req.sony_id}\``, inline: true },
                            { name: '✅ Approved by', value: `<@${interaction.user.id}>`, inline: true },
                        )
                        .setFooter({ text: 'Activation System • FANTASY Bot' }).setTimestamp();

                    await interaction.update({ embeds: [approveEmbed], components: [] });

                    try {
                        const user = await client.users.fetch(req.user_id);
                        await user.send(
                            `✅ **Your activation request in server ${interaction.guild.name} has been approved!**\n` +
                            `> 🎮 **Sony ID:** \`${req.sony_id}\`\n` +
                            `> You can now access the server fully.`
                        );
                    } catch (_) {}

                } else {
                    const rejectEmbed = new EmbedBuilder()
                        .setTitle('Activation Request Rejected')
                        .setColor(0xB71C1C)
                        .addFields(
                            { name: '👤 Player',      value: `<@${req.user_id}>`,         inline: true },
                            { name: '🎮 Sony ID',     value: `\`${req.sony_id}\``,         inline: true },
                            { name: '❌ Rejected by', value: `<@${interaction.user.id}>`,  inline: true },
                        )
                        .setFooter({ text: 'Activation System • FANTASY Bot' }).setTimestamp();

                    await interaction.update({ embeds: [rejectEmbed], components: [] });

                    try {
                        const user = await client.users.fetch(req.user_id);
                        await user.send(
                            `❌ **Your activation request in server ${interaction.guild.name} has been rejected.**\n` +
                            `> Contact Admin for the reason or to try again.`
                        );
                    } catch (_) {}
                }

                await db.deleteActivationRequest(reqId);
            } catch (e) {
                console.error(e);
                if (!interaction.replied && !interaction.deferred)
                    interaction.reply({ content: '❌ An error occurred.', flags: 64 });
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
                    const SLOT_NAMES_B = { 1: 'Character 1', 2: 'Character 2', 3: 'Character 3' };
                    const embed = new EmbedBuilder()
                        .setTitle('Money Display')
                        .setColor(0x1565C0)
                        .addFields(
                            { name: '👤 Name',         value: `${identity.character_name || '—'} ${identity.family_name || ''}`, inline: true },
                            { name: '📌 Character',    value: SLOT_NAMES_B[identity.slot] || `Character ${identity.slot}`, inline: true },
                            { name: '\u200b', value: '\u200b', inline: true },
                            { name: '🏦 Bank Balance', value: `\`${Number(identity.balance).toLocaleString()} Riyals\``, inline: true },
                            { name: '💵 Cash',          value: `\`${Number(identity.cash || 0).toLocaleString()} Riyals\``, inline: true },
                            { name: '🏦 IBAN',          value: `\`${identity.iban}\``, inline: true },
                            { name: '🔒 Status',        value: identity.frozen ? '❄️ Frozen' : '✅ Active', inline: true },
                        )
                        .setFooter({ text: 'Bank System • FANTASY Bot' })
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }

                if (interaction.customId === 'bank_deposit') {
                    const identity = await db.getActiveIdentity(interaction.user.id);
                    if (identity.frozen) return interaction.reply({ content: '❄️ Your account is frozen.', flags: 64 });
                    const modal = new ModalBuilder().setCustomId('bank_deposit_modal').setTitle('Deposit Cash to Bank');
                    modal.addComponents(new ARB().addComponents(
                        new TextInputBuilder().setCustomId('deposit_amount').setLabel('Amount to Deposit (Riyals)').setStyle(TextInputStyle.Short).setRequired(true)
                    ));
                    return interaction.showModal(modal);
                }

                if (interaction.customId === 'bank_withdraw') {
                    const identity = await db.getActiveIdentity(interaction.user.id);
                    if (identity.frozen) return interaction.reply({ content: '❄️ Your account is frozen.', flags: 64 });
                    const modal = new ModalBuilder().setCustomId('bank_withdraw_modal').setTitle('Withdraw Cash from Bank');
                    modal.addComponents(new ARB().addComponents(
                        new TextInputBuilder().setCustomId('withdraw_amount').setLabel('Amount to Withdraw (Riyals)').setStyle(TextInputStyle.Short).setRequired(true)
                    ));
                    return interaction.showModal(modal);
                }

                if (interaction.customId === 'bank_transfer') {
                    const identity = await db.getActiveIdentity(interaction.user.id);
                    if (identity.frozen) return interaction.reply({ content: '❄️ Your account is frozen.', flags: 64 });
                    const modal = new ModalBuilder().setCustomId('bank_transfer_modal').setTitle('Bank Transfer');
                    modal.addComponents(
                        new ARB().addComponents(new TextInputBuilder().setCustomId('transfer_iban').setLabel('Recipient IBAN (7 digits)').setStyle(TextInputStyle.Short).setMinLength(7).setMaxLength(7).setRequired(true)),
                        new ARB().addComponents(new TextInputBuilder().setCustomId('transfer_amount').setLabel('Amount (Riyals)').setStyle(TextInputStyle.Short).setRequired(true)),
                        new ARB().addComponents(new TextInputBuilder().setCustomId('transfer_note').setLabel('Note (optional)').setStyle(TextInputStyle.Short).setRequired(false)),
                    );
                    return interaction.showModal(modal);
                }
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'An error occurred.', flags: 64 });
            }
        }

        if (['snap_create','snap_send','snap_inbox','snap_friends','snap_add','snap_requests'].includes(interaction.customId)) {
            const { ModalBuilder: MSN, TextInputBuilder: TISN, TextInputStyle: TSSN, ActionRowBuilder: ARSN, StringSelectMenuBuilder: SSSN } = require('discord.js');
            await db.ensureUser(interaction.user.id, interaction.user.username);
            { const _e = await db.checkLoginAndIdentity(interaction.user.id); if (_e) return interaction.reply({ content: _e, flags: 64 }); }

            if (interaction.customId === 'snap_create') {
                const acc = await db.getSnapAccount(interaction.user.id);
                if (acc) return interaction.reply({ content: `❌ You already have an account: **${acc.snap_username}**`, flags: 64 });
                const modal = new MSN().setCustomId('snap_create_modal').setTitle('Create Snap Account')
                    .addComponents(new ARSN().addComponents(
                        new TISN().setCustomId('snap_user').setLabel('Account Username')
                            .setStyle(TSSN.Short).setRequired(true).setMinLength(3).setMaxLength(20)
                            .setPlaceholder('Example: Sultan2025')
                    ));
                return interaction.showModal(modal);
            }

            if (interaction.customId === 'snap_send') {
                const acc = await db.getSnapAccount(interaction.user.id);
                if (!acc) return interaction.reply({ content: '❌ You do not have a Snap account. Create one first.', flags: 64 });
                const friends = await db.getSnapFriends(interaction.user.id);
                if (!friends.length) return interaction.reply({ content: '❌ You have no friends yet. Add a friend first.', flags: 64 });
                const options = friends.slice(0, 25).map(f => ({
                    label: f.friend_username,
                    value: f.friend_id,
                    description: `🔥 Streak: ${f.streak}`,
                }));
                const row = new ARSN().addComponents(
                    new SSSN().setCustomId('snap_friend_select').setPlaceholder('👻 Choose a friend to send a snap').addOptions(options)
                );
                return interaction.reply({ content: '📸 **Choose the friend you want to send a snap to:**', components: [row], flags: 64 });
            }

            if (interaction.customId === 'snap_inbox') {
                const acc = await db.getSnapAccount(interaction.user.id);
                if (!acc) return interaction.reply({ content: '❌ You do not have a Snap account.', flags: 64 });
                const msgs = await db.getSnapInbox(interaction.user.id);
                const embed = new EmbedBuilder()
                    .setTitle('Snap Inbox')
                    .setColor(0xFFFC00)
                    .setFooter({ text: 'Snapchat • FANTASY Bot' })
                    .setTimestamp();
                if (!msgs.length) {
                    embed.setDescription('> 📭 No incoming snaps');
                } else {
                    const unseen = msgs.filter(m => !m.seen);
                    embed.setDescription(`📩 **${unseen.length}** new unread snap(s)`);
                    const fields = msgs.slice(0, 10).map(m => ({
                        name: `${m.seen ? '📖' : '🔴'} From: **${m.sender_username}**`,
                        value: `> ${m.content}\n⏰ ${new Date(m.created_at).toLocaleString('en-US')}`,
                        inline: false,
                    }));
                    embed.addFields(fields);
                    for (const m of msgs.filter(m => !m.seen)) await db.markSnapSeen(m.id, interaction.user.id);
                }
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            if (interaction.customId === 'snap_friends') {
                const acc = await db.getSnapAccount(interaction.user.id);
                if (!acc) return interaction.reply({ content: '❌ You do not have a Snap account.', flags: 64 });
                const friends = await db.getSnapFriends(interaction.user.id);
                const embed = new EmbedBuilder()
                    .setTitle('My Snap Friends')
                    .setColor(0xFFFC00)
                    .setFooter({ text: `${friends.length} friend(s) • Snapchat • FANTASY Bot` })
                    .setTimestamp();
                if (!friends.length) {
                    embed.setDescription('> No friends yet. Use **➕ Add Friend**');
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
                            value: `${streakBadge} **${streak}** streak\n${status}`,
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
                if (!acc) return interaction.reply({ content: '❌ You do not have a Snap account. Create one first.', flags: 64 });
                const modal = new MSN().setCustomId('snap_add_modal').setTitle('Add Friend')
                    .addComponents(new ARSN().addComponents(
                        new TISN().setCustomId('friend_snap_name').setLabel('Friend\'s Snap account name')
                            .setStyle(TSSN.Short).setRequired(true).setMaxLength(20)
                            .setPlaceholder('Example: Sultan2025')
                    ));
                return interaction.showModal(modal);
            }

            if (interaction.customId === 'snap_requests') {
                const acc = await db.getSnapAccount(interaction.user.id);
                if (!acc) return interaction.reply({ content: '❌ You do not have a Snap account.', flags: 64 });
                const requests = await db.getPendingSnapRequests(interaction.user.id);
                const embed = new EmbedBuilder()
                    .setTitle('Incoming Friend Requests')
                    .setColor(0xFFFC00)
                    .setFooter({ text: 'Snapchat • FANTASY Bot' })
                    .setTimestamp();
                if (!requests.length) {
                    embed.setDescription('> No pending friend requests.');
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }
                embed.setDescription(`📩 **${requests.length}** friend request(s)`);
                const options = requests.slice(0, 25).map(r => ({
                    label: r.requester_username,
                    value: r.requester_id,
                    description: 'Tap to accept',
                }));
                const row = new ARSN().addComponents(
                    new SSSN().setCustomId('snap_accept_select').setPlaceholder('✅ Choose a request to accept').addOptions(options)
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
                if (existing) return interaction.reply({ content: `❌ You already have an account: **@${existing.x_username}**`, flags: 64 });
                const modal = new MBX().setCustomId('x_create_modal').setTitle('Create X Account')
                    .addComponents(new ARBX().addComponents(
                        new TIBX().setCustomId('x_username').setLabel('Account Username (without @)')
                            .setStyle(TISX.Short).setRequired(true).setMinLength(3).setMaxLength(20)
                    ));
                return interaction.showModal(modal);
            }

            if (interaction.customId === 'x_send_tweet') {
                const xChannel = await db.getConfig('x_channel');
                if (!xChannel) return interaction.reply({ content: '❌ Tweet channel not configured yet. Contact admins.', flags: 64 });
                const account = await db.getXAccount(interaction.user.id);
                if (!account) return interaction.reply({ content: '❌ You do not have an X Platform account. Create one first.', flags: 64 });
                const modal = new MBX().setCustomId('x_tweet_modal').setTitle('Send Tweet')
                    .addComponents(new ARBX().addComponents(
                        new TIBX().setCustomId('tweet_content').setLabel('Tweet Content')
                            .setStyle(TISX.Paragraph).setRequired(true).setMaxLength(280)
                    ));
                return interaction.showModal(modal);
            }

            if (interaction.customId === 'x_delete_account') {
                const account = await db.getXAccount(interaction.user.id);
                if (!account) return interaction.reply({ content: '❌ You do not have an X Platform account.', flags: 64 });
                await db.deleteXAccount(interaction.user.id);
                const embed = new EmbedBuilder()
                    .setTitle('Account Deleted')
                    .setColor(0xB71C1C)
                    .setDescription(`Account **@${account.x_username}** and all its tweets have been permanently deleted.`)
                    .setFooter({ text: 'X Platform • FANTASY Bot' })
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
                    .setTitle('Your Inventory')
                    .setColor(0xE65100)
                    .setFooter({ text: `Total Items: ${items.length} • Bag System • FANTASY Bot` })
                    .setTimestamp();

                if (!items.length) {
                    embed.setDescription('> 🪹 Your bag is currently empty');
                } else {
                    embed.setDescription(`📦 **${items.length}** item(s) in your bag`);
                    const SPACER = { name: '\u200b', value: '\u200b', inline: true };
                    const fields = items.map(i => ({
                        name: `┌─ ${i.item_name} ─┐`,
                        value: `📦 Qty: \`${i.quantity}\``,
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
                if (!items.length) return interaction.reply({ content: '❌ Your bag is empty, nothing to use.', flags: 64 });
                const options = items.slice(0, 25).map(i => ({
                    label: i.item_name,
                    value: `use_${i.item_name}`,
                    description: `Qty: ${i.quantity}`,
                }));
                const row = new ARB2().addComponents(
                    new SSM2().setCustomId('bag_use_select').setPlaceholder('Choose an item to use').addOptions(options)
                );
                return interaction.reply({ content: '✅ **Choose the item you want to use:**', components: [row], flags: 64 });
            }

            if (interaction.customId === 'bag_transfer') {
                const modal = new MB2()
                    .setCustomId('bag_transfer_modal')
                    .setTitle('Transfer Item')
                    .addComponents(
                        new ARB2().addComponents(
                            new TIB2().setCustomId('transfer_item_name').setLabel('Item name')
                                .setStyle(TIS2.Short).setRequired(true).setMaxLength(50)
                        ),
                        new ARB2().addComponents(
                            new TIB2().setCustomId('transfer_iban').setLabel('Recipient IBAN')
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
                if (!req) return interaction.reply({ content: '❌ Request not found or has expired.', flags: 64 });
                if (req.lawyer_id !== interaction.user.id) return interaction.reply({ content: '❌ This request is not addressed to you.', flags: 64 });
                if (req.status !== 'pending') return interaction.reply({ content: '❌ This request has already been processed.', flags: 64 });

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
                        `Retainer fee — Case ${req.case_number}`
                    );

                    try {
                        const fullCase = await db.getCaseById(req.case_id);
                        const lawyerUser = await interaction.client.users.fetch(interaction.user.id);
                        const caseEmbed = new EmbedBuilder()
                            .setTitle('New Case Details')
                            .setColor(0x0D47A1)
                            .setDescription('You have accepted this case. Here are the client and case details:')
                            .addFields(
                                { name: '🔢 Case Number',   value: fullCase?.case_number || req.case_number, inline: true },
                                { name: '📌 Case Title',    value: fullCase?.title || req.case_title, inline: true },
                                { name: '👤 Client Name',   value: req.plaintiff_name, inline: true },
                                { name: '🪪 Client ID',     value: `<@${req.plaintiff_id}>`, inline: true },
                                { name: '🎯 Defendant',     value: fullCase?.defendant || '—', inline: true },
                                { name: '📋 Description',   value: fullCase?.description || '—', inline: false },
                                { name: '🗂️ Evidence',      value: fullCase?.evidence || '—', inline: false },
                            )
                            .setFooter({ text: 'Law System • FANTASY Bot' })
                            .setTimestamp();
                        await lawyerUser.send({ embeds: [caseEmbed] });
                    } catch (_) {}
                }

                // إشعار الموكّل
                try {
                    const { RETAINER_FEE } = require('./commands/lawyer-tasks');
                    const plaintiffUser = await interaction.client.users.fetch(req.plaintiff_id);
                    const dmFields = [
                        { name: '🔢 Case Number', value: req.case_number,              inline: true },
                        { name: '📌 Title',        value: req.case_title,               inline: true },
                        { name: '👨‍⚖️ Lawyer',    value: lawyer?.lawyer_name || '—', inline: true },
                    ];
                    if (isAccept) {
                        dmFields.push({
                            name: '💰 Retainer Fee',
                            value: feeResult?.success
                                ? `✅ **${RETAINER_FEE.toLocaleString()} Riyals** deducted from your account`
                                : `⚠️ ${feeResult?.error || 'Failed to deduct retainer fee'}`,
                            inline: false,
                        });
                    }
                    const dmEmbed = new EmbedBuilder()
                        .setTitle(isAccept ? '✅ Retainer Request Accepted' : '❌ Retainer Request Rejected')
                        .setColor(isAccept ? 0x1B5E20 : 0xB71C1C)
                        .addFields(...dmFields)
                        .setFooter({ text: 'Law System • FANTASY Bot' }).setTimestamp();
                    await plaintiffUser.send({ embeds: [dmEmbed] });
                } catch (_) {}

                // تحديث اللوحة
                const { buildTasks } = require('./commands/lawyer-tasks');
                const newDash = await buildTasks(db, interaction.user.id, lawyer?.lawyer_name || interaction.user.username);
                return interaction.update(newDash);
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        if (interaction.customId.startsWith('lawyer_atab_')) {
            try {
                const caseId = Number(interaction.customId.replace('lawyer_atab_', ''));
                const c = await db.getCaseById(caseId);
                if (!c) return interaction.reply({ content: '❌ Case not found.', flags: 64 });
                if (c.lawyer_id !== interaction.user.id)
                    return interaction.reply({ content: '❌ You are not the lawyer of this case.', flags: 64 });

                const DAYS_REQUIRED = 15;
                const assignedAt = c.lawyer_assigned_at ? new Date(c.lawyer_assigned_at).getTime() : null;
                const daysPassed  = assignedAt ? Math.floor((Date.now() - assignedAt) / 86_400_000) : 0;
                if (daysPassed < DAYS_REQUIRED)
                    return interaction.reply({ content: `⏳ It is not yet time to claim fees — **${DAYS_REQUIRED - daysPassed} day(s)** remaining.`, flags: 64 });

                const { ATAB_FEE } = require('./commands/lawyer-tasks');
                const result = await db.chargeLawyerFee(
                    c.plaintiff_id,
                    interaction.user.id,
                    ATAB_FEE,
                    `Legal fees — Case ${c.case_number}`
                );

                if (!result.success)
                    return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });

                try {
                    const plaintiffUser = await interaction.client.users.fetch(c.plaintiff_id);
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('Legal Fees Deducted')
                        .setColor(0xE65100)
                        .addFields(
                            { name: '🔢 Case Number',    value: c.case_number,              inline: true },
                            { name: '📌 Title',          value: c.title,                   inline: true },
                            { name: '👨‍⚖️ Lawyer',      value: c.lawyer_name || '—',     inline: true },
                            { name: '💰 Amount Deducted', value: `**${ATAB_FEE.toLocaleString()} Riyals**`, inline: false },
                        )
                        .setFooter({ text: 'Law System • FANTASY Bot' }).setTimestamp();
                    await plaintiffUser.send({ embeds: [dmEmbed] });
                } catch (_) {}

                const allLawyers = await db.getLawyers();
                const lawyerData = allLawyers.find(l => l.discord_id === interaction.user.id);
                const { buildTasks } = require('./commands/lawyer-tasks');
                const newDash = await buildTasks(db, interaction.user.id, lawyerData?.lawyer_name || interaction.user.username);
                return interaction.update(newDash);
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        // ── التخلي عن قضية (فتح modal) ───────────────────────────────────────
        if (interaction.customId.startsWith('lawyer_abandon_')) {
            try {
                const caseId = Number(interaction.customId.replace('lawyer_abandon_', ''));
                const c = await db.getCaseById(caseId);
                if (!c) return interaction.reply({ content: '❌ Case not found.', flags: 64 });
                if (c.lawyer_id !== interaction.user.id)
                    return interaction.reply({ content: '❌ You are not the lawyer of this case.', flags: 64 });

                const { ABANDON_FEE } = require('./commands/lawyer-tasks');
                const modal = new ModalBuilder()
                    .setCustomId(`lawyer_abandon_modal_${caseId}`)
                    .setTitle(`🚫 Abandon Case — ${c.case_number}`);
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('abandon_reason')
                            .setLabel(`Reason for abandoning the case`)
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder(`This reason will be sent to the client • ${ABANDON_FEE.toLocaleString()} Riyals will be deducted`)
                            .setRequired(true)
                            .setMinLength(10)
                    )
                );
                return interaction.showModal(modal);
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        // ── أزرار الأولوية ──────────────────────────────────────────────────────────
        if (interaction.customId.startsWith('priority_')) {
            try {
                const btnId = parseInt(interaction.customId.replace('priority_', ''));
                const buttons = await db.getPriorityButtons();
                const btn = buttons.find(b => b.id === btnId);
                if (!btn) return interaction.reply({ content: '❌ This button no longer exists.', flags: 64 });

                const channelId = await db.getConfig('priority_channel_id');
                if (!channelId) return interaction.reply({ content: '❌ Priority channel has not been set yet.', flags: 64 });

                const targetChannel = interaction.guild.channels.cache.get(channelId);
                if (!targetChannel) return interaction.reply({ content: '❌ Priority channel not found.', flags: 64 });

                await targetChannel.send(btn.priority);
                await interaction.reply({ content: `✅ Sent successfully.`, flags: 64 });
            } catch (e) { console.error(e); }
            return;
        }

        // ── تجميع الموارد ──────────────────────────────────────────────────────────
        if (interaction.customId === 'gather_resources') {
            try {
                const identity = await db.getActiveIdentity(interaction.user.id);
                if (!identity) return interaction.reply({ content: 'You are not logged in. Please log in first.', flags: 64 });

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

                await interaction.followUp({
                    content: `🪛 You gathered **${amount}x ${picked.emoji} ${picked.name}** and added them to your bag!`,
                    flags: 64
                });
            } catch (e) { console.error(e); }
            return;
        }

        // ── ملف المواطن — أزرار التنقل والرجوع ──────────────────────────────────
        if (interaction.customId.startsWith('citizen_file_back:') ||
            interaction.customId.startsWith('citizen_file_prev:') ||
            interaction.customId.startsWith('citizen_file_next:')) {
            const chefRoleId = await db.getConfig('cia_chef_role');
            if (!chefRoleId || !interaction.member.roles.cache.has(chefRoleId))
                return interaction.reply({ content: '❌ Unauthorized.', flags: 64 });
            try {
                await interaction.deferUpdate();
                const parts   = interaction.customId.split(':');
                const action  = parts[0];
                const curPage = parseInt(parts[1]) || 0;
                let newPage = curPage;
                if (action === 'citizen_file_prev') newPage = Math.max(0, curPage - 1);
                if (action === 'citizen_file_next') newPage = curPage + 1;
                const { buildCitizenList } = require('./commands/citizen-file');
                const payload = await buildCitizenList(db, newPage);
                await interaction.message.edit(payload);
            } catch (e) {
                console.error('[CITIZEN FILE BTN]', e);
            }
            return;
        }

        // ── فتح تكت ─────────────────────────────────────────────────────────────
        if (interaction.customId.startsWith('open_ticket_')) {
            const typeId = parseInt(interaction.customId.replace('open_ticket_', ''));
            return handleOpenTicket(interaction, typeId);
        }

        // ── استلام تكت ──────────────────────────────────────────────────────────
        if (interaction.customId.startsWith('claim_ticket_')) {
            const channelId = interaction.customId.replace('claim_ticket_', '');
            const claimer   = interaction.user;
            const { ActionRowBuilder: ARB3, ButtonBuilder: BB3, ButtonStyle: BS3 } = require('discord.js');

            const newRow = new ARB3().addComponents(
                new BB3()
                    .setCustomId(`claim_ticket_${channelId}`)
                    .setLabel(`Claimed by: ${claimer.username}`).setEmoji('✅')
                    .setStyle(BS3.Success)
                    .setDisabled(true),
                new BB3()
                    .setCustomId(`close_ticket_${channelId}`)
                    .setLabel('Close Ticket').setEmoji('🔒')
                    .setStyle(BS3.Danger)
            );

            await interaction.update({ components: [newRow] }).catch(() => {});
            await db.addStaffActivity(claimer.id, 'tickets_count').catch(() => {});
        }

        // ── كشف نقاط Admin ────────────────────────────────────────────────────
        if (interaction.customId === 'points_check') {
            const data  = await db.getStaffActivity(interaction.user.id);
            const trips   = data.trips_count   || 0;
            const gmc     = data.gmc_count     || 0;
            const tickets = data.tickets_count || 0;
            const manual  = data.manual_points || 0;
            const total   = trips * 5 + gmc * 8 + tickets * 5 + manual;

            const embed = new EmbedBuilder()
                .setTitle(`📊 Points for ${interaction.user.username}`)
                .setColor(0x1565C0)
                .addFields(
                    { name: '🚀 Trips Opened',        value: `${trips} trip(s) × 5 = **${trips * 5} pts**`,    inline: false },
                    { name: '👁️ GMC Supervision',     value: `${gmc} time(s) × 8 = **${gmc * 8} pts**`,       inline: false },
                    { name: '🎫 Tickets Claimed',      value: `${tickets} ticket(s) × 5 = **${tickets * 5} pts**`, inline: false },
                    { name: '✏️ Manually Added Points', value: `**${manual} pts**`,                               inline: false },
                    { name: '─────────────────',       value: `🏆 **Total: ${total} pts**`,                     inline: false },
                )
                .setFooter({ text: 'Admin Points System • FANTASY Bot' }).setTimestamp();
            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        if (interaction.customId === 'comp_deposit_btn' || interaction.customId === 'comp_withdraw_btn') {
            try {
                const investorRoleId = await db.getConfig('investor_role');
                const isAdmin = interaction.member.permissions.has(require('discord.js').PermissionFlagsBits.Administrator);
                if (investorRoleId && !isAdmin && !interaction.member.roles.cache.has(investorRoleId))
                    return interaction.reply({ content: '❌ This action is for **Investor** rank holders only.', flags: 64 });
                const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
                const isDeposit = interaction.customId === 'comp_deposit_btn';
                const modal = new ModalBuilder()
                    .setCustomId(isDeposit ? 'comp_deposit_modal' : 'comp_withdraw_modal')
                    .setTitle(isDeposit ? '📥 Deposit to Company Account' : '💸 Withdraw from Company Account');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('amount').setLabel('Amount')
                            .setStyle(TextInputStyle.Short).setPlaceholder('Enter amount in numbers only')
                            .setRequired(true).setMaxLength(15)
                    )
                );
                return interaction.showModal(modal);
            } catch (e) { console.error(e); }
            return;
        }

        if (interaction.customId === 'comp_hire_btn') {
            try {
                const investorRoleId = await db.getConfig('investor_role');
                const isAdmin = interaction.member.permissions.has(require('discord.js').PermissionFlagsBits.Administrator);
                if (investorRoleId && !isAdmin && !interaction.member.roles.cache.has(investorRoleId))
                    return interaction.reply({ content: '❌ This action is for **Investor** rank holders only.', flags: 64 });
                const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
                const modal = new ModalBuilder().setCustomId('comp_hire_modal').setTitle('Assign Employee');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('user_id').setLabel('Player ID (copy from Discord)')
                            .setStyle(TextInputStyle.Short).setPlaceholder('Example: 123456789012345678')
                            .setRequired(true).setMaxLength(20)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('role').setLabel('Role (Manager / Accountant / Employee)')
                            .setStyle(TextInputStyle.Short).setPlaceholder('Employee')
                            .setRequired(true).setMaxLength(20)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('salary').setLabel('Monthly Salary (numbers only)')
                            .setStyle(TextInputStyle.Short).setPlaceholder('Example: 5000')
                            .setRequired(true).setMaxLength(12)
                    ),
                );
                return interaction.showModal(modal);
            } catch (e) { console.error(e); }
            return;
        }

        if (interaction.customId === 'comp_paysalaries_btn') {
            try {
                const investorRoleId = await db.getConfig('investor_role');
                const isAdmin = interaction.member.permissions.has(require('discord.js').PermissionFlagsBits.Administrator);
                if (investorRoleId && !isAdmin && !interaction.member.roles.cache.has(investorRoleId))
                    return interaction.reply({ content: '❌ This action is for **Investor** rank holders only.', flags: 64 });
                const company = await db.getCompanyByOwner(interaction.user.id);
                if (!company)
                    return interaction.reply({ content: '❌ You are not the owner of any company.', flags: 64 });

                const res = await db.payCompanySalaries(company.id);
                if (res.error)
                    return interaction.reply({ content: `❌ ${res.error}`, flags: 64 });

                const salaryLines = res.members.map(m =>
                    `<@${m.discord_id}> — \`${parseInt(m.salary).toLocaleString()} Riyals\``
                ).join('\n');

                const embed = new EmbedBuilder()
                    .setTitle('Salaries Deposited')
                    .setColor(0x2E7D32)
                    .setDescription(`**${res.total.toLocaleString()} Riyals** deducted from the company balance and deposited into employee accounts.`)
                    .addFields(
                        { name: `👥 Employees (${res.members.length})`, value: salaryLines, inline: false },
                        { name: '🏢 Company',     value: company.name, inline: true },
                        { name: '💳 Total Paid', value: `\`${res.total.toLocaleString()} Riyals\``, inline: true },
                    )
                    .setFooter({ text: 'Company System • FANTASY Bot' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed] });
            } catch (e) {
                console.error('[PAY SALARIES ERROR]', e);
                if (!interaction.replied) interaction.reply({ content: '❌ An error occurred while paying salaries.', flags: 64 });
            }
            return;
        }

        if (interaction.customId === 'comp_promote_btn') {
            try {
                const investorRoleId = await db.getConfig('investor_role');
                const isAdmin = interaction.member.permissions.has(require('discord.js').PermissionFlagsBits.Administrator);
                if (investorRoleId && !isAdmin && !interaction.member.roles.cache.has(investorRoleId))
                    return interaction.reply({ content: '❌ This action is for **Investor** rank holders only.', flags: 64 });
                const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
                const modal = new ModalBuilder().setCustomId('comp_promote_modal').setTitle('Promote Employee');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('user_id').setLabel('Player ID (copy from Discord)')
                            .setStyle(TextInputStyle.Short).setPlaceholder('Example: 123456789012345678')
                            .setRequired(true).setMaxLength(20)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('role').setLabel('New Role (Manager / Accountant / Employee)')
                            .setStyle(TextInputStyle.Short).setPlaceholder('Manager')
                            .setRequired(true).setMaxLength(20)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('salary').setLabel('New Salary (numbers only)')
                            .setStyle(TextInputStyle.Short).setPlaceholder('Example: 8000')
                            .setRequired(true).setMaxLength(12)
                    ),
                );
                return interaction.showModal(modal);
            } catch (e) { console.error(e); }
            return;
        }

        if (interaction.customId === 'comp_fire_btn') {
            try {
                const investorRoleId = await db.getConfig('investor_role');
                const isAdmin = interaction.member.permissions.has(require('discord.js').PermissionFlagsBits.Administrator);
                if (investorRoleId && !isAdmin && !interaction.member.roles.cache.has(investorRoleId))
                    return interaction.reply({ content: '❌ This action is for **Investor** rank holders only.', flags: 64 });
                const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
                const modal = new ModalBuilder().setCustomId('comp_fire_modal').setTitle('Fire Employee');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('user_id').setLabel('Player ID (copy from Discord)')
                            .setStyle(TextInputStyle.Short).setPlaceholder('Example: 123456789012345678')
                            .setRequired(true).setMaxLength(20)
                    ),
                );
                return interaction.showModal(modal);
            } catch (e) { console.error(e); }
            return;
        }

        if (interaction.customId === 'comp_dissolve_btn') {
            try {
                const investorRoleId = await db.getConfig('investor_role');
                const isAdmin = interaction.member.permissions.has(require('discord.js').PermissionFlagsBits.Administrator);
                if (investorRoleId && !isAdmin && !interaction.member.roles.cache.has(investorRoleId))
                    return interaction.reply({ content: '❌ This action is for **Investor** rank holders only.', flags: 64 });
                const company = await db.getCompanyByOwner(interaction.user.id);
                if (!company)
                    return interaction.reply({ content: '❌ You are not the owner of any company.', flags: 64 });
                if (company.balance > 0)
                    return interaction.reply({ content: `❌ Cannot dissolve company while it has a balance of **${company.balance.toLocaleString()} Riyals**. Withdraw the balance first.`, flags: 64 });

                await db.dissolveCompany(company.id);
                const embed = new EmbedBuilder()
                    .setTitle('Company Dissolved')
                    .setColor(0xB71C1C)
                    .setDescription(`Company **${company.name}** has been permanently dissolved and all its records closed.`)
                    .setFooter({ text: 'Company System • FANTASY Bot' }).setTimestamp();
                return interaction.reply({ embeds: [embed] });
            } catch (e) {
                console.error(e);
                if (!interaction.replied) interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
            return;
        }

        // ── سوق الأسهم — شراء / بيع / محفظة ────────────────────────────────
        if (['stock_buy_btn','stock_sell_btn','stock_portfolio_btn'].includes(interaction.customId)) {
            try {
                const loginErr = await db.checkLoginAndIdentity(interaction.user.id);
                if (loginErr) return interaction.reply({ content: loginErr, flags: 64 });

                if (interaction.customId === 'stock_portfolio_btn') {
                    const portfolio = await db.getUserPortfolio(interaction.user.id);
                    if (!portfolio.length)
                        return interaction.reply({ content: '📭 Your portfolio is empty — you have no shares currently.', flags: 64 });
                    let totalValue = 0;
                    let desc = '';
                    for (const p of portfolio) {
                        const value = parseFloat(p.current_price) * p.shares;
                        totalValue += value;
                        const pl = value - parseFloat(p.ipo_price) * p.shares;
                        desc += `**🏢 ${p.company_name}** — \`${p.shares}\` shares × \`${parseFloat(p.current_price).toFixed(0)} Riyals\` = **${value.toLocaleString(undefined,{maximumFractionDigits:0})} Riyals**  ${pl>=0?`🟢 +${pl.toFixed(0)}`:`🔴 ${pl.toFixed(0)}`} Riyals\n`;
                    }
                    const embed = new EmbedBuilder()
                        .setTitle('Your Investment Portfolio')
                        .setColor(0x1B5E20)
                        .setDescription(desc)
                        .addFields({ name: '💰 Total Value', value: `\`${totalValue.toLocaleString(undefined,{maximumFractionDigits:0})} Riyals\`` })
                        .setFooter({ text: 'Stock Market • FANTASY Bot' }).setTimestamp();
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }

                const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
                const isBuy = interaction.customId === 'stock_buy_btn';
                const allListings = await db.getAllStockListings();
                if (!allListings.length)
                    return interaction.reply({ content: '❌ No companies are currently listed on the market.', flags: 64 });

                const options = allListings.slice(0, 25).map(l =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(l.company_name.slice(0, 100))
                        .setValue(String(l.company_id))
                        .setDescription(`Price: ${parseFloat(l.current_price).toFixed(0)} Riyals | Available shares: ${l.avail_shares}`)
                );
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(isBuy ? 'stock_company_select:buy' : 'stock_company_select:sell')
                    .setPlaceholder(isBuy ? '📈 Choose a company to buy from' : '📉 Choose a company to sell')
                    .addOptions(options);
                return interaction.reply({
                    content: isBuy ? '📈 **Choose the company whose shares you want to buy:**' : '📉 **Choose the company whose shares you want to sell:**',
                    components: [new ActionRowBuilder().addComponents(selectMenu)],
                    flags: 64
                });
            } catch (e) {
                console.error('[STOCK BTN ERROR]', e);
                if (!interaction.replied) interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
            return;
        }

        if (interaction.customId === 'company_apply_btn') {
            try {
                const identity = await db.getActiveIdentity(interaction.user.id);
                if (!identity)
                    return interaction.reply({ content: 'You are not logged in. Please log in first.', flags: 64 });

                const hasPerm = await db.hasTradePermit(interaction.user.id);
                if (!hasPerm)
                    return interaction.reply({ content: '❌ You do not have a trade permit. Contact the **Ministry of Commerce** to obtain one.', flags: 64 });

                const existingComp = await db.getUserCompany(interaction.user.id);
                if (existingComp)
                    return interaction.reply({ content: `❌ You are already associated with company **${existingComp.name}**. You cannot found another company.`, flags: 64 });

                const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
                const modal = new ModalBuilder()
                    .setCustomId('company_found_modal')
                    .setTitle('Company Establishment Form');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('cf_personal').setLabel('Personal Information')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('1. Your in-roleplay name:\n2. Your in-roleplay age:\n3. Your real age:')
                            .setRequired(true).setMaxLength(300)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('cf_name').setLabel('Company Name')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Enter the company name here')
                            .setRequired(true).setMaxLength(40)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('cf_details').setLabel('Company Details')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('Company type / Detailed business idea / Company location in the city')
                            .setRequired(true).setMaxLength(800)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('cf_management').setLabel('Management & Staffing Plan')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('How you manage the company / prior experience / number of employees / hiring plan')
                            .setRequired(true).setMaxLength(800)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('cf_financial').setLabel('Financial & Commitment')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('Capital / Source of funds / Profit plan / Commitment to rules / Acceptance of closure')
                            .setRequired(true).setMaxLength(800)
                    ),
                );

                return interaction.showModal(modal);
            } catch (e) {
                console.error('[COMPANY APPLY BTN ERROR]', e);
                if (!interaction.replied) interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
            return;
        }

        if (interaction.customId === 'company_list_btn') {
            try {
                const userCompany = await db.getUserCompany(interaction.user.id);
                if (!userCompany) {
                    const { ActionRowBuilder: ARB2, ButtonBuilder: BB2, ButtonStyle: BS2 } = require('discord.js');
                    const applyRow = new ARB2().addComponents(
                        new BB2().setCustomId('company_apply_btn').setLabel('Submit Establishment Request').setEmoji('📋').setStyle(BS2.Success)
                    );
                    return interaction.reply({
                        content: '❌ You do not have a registered company. You can submit an establishment request using the button below.',
                        components: [applyRow],
                        flags: 64
                    });
                }

                const companies = await db.getAllCompanies();
                if (!companies.length)
                    return interaction.reply({ content: '📋 No registered companies found.', flags: 64 });

                const list = companies.map((c, i) =>
                    `**${i + 1}.** 🏢 **${c.name}** — Owner: <@${c.owner_discord_id}> — Balance: \`${(c.balance || 0).toLocaleString()} Riyals\``
                ).join('\n');

                const embed = new EmbedBuilder()
                    .setTitle('Registered Companies List')
                    .setColor(0x1565C0)
                    .setDescription(list)
                    .setFooter({ text: `Company System • ${companies.length} company/companies` })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error('[COMPANY LIST BTN ERROR]', e);
                if (!interaction.replied) interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
            return;
        }

        // ── إضافة / Deduct Points (مسؤولين فقط) ─────────────────────────────────────
        if (interaction.customId === 'points_add_btn' || interaction.customId === 'points_deduct_btn') {
            const isAdd = interaction.customId === 'points_add_btn';
            const pointsAdminRole = await db.getConfig('points_admin_role');
            const isAdmin = pointsAdminRole
                ? interaction.member.roles.cache.has(pointsAdminRole)
                : interaction.member.permissions.has(PermissionFlagsBits.Administrator);
            if (!isAdmin) return interaction.reply({ content: '❌ Only points admins can use this button.', flags: 64 });

            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder: ARB4 } = require('discord.js');
            const modal = new ModalBuilder()
                .setCustomId(isAdd ? 'points_add_modal' : 'points_deduct_modal')
                .setTitle(isAdd ? '➕ Add Points' : '➖ Deduct Points');
            modal.addComponents(
                new ARB4().addComponents(
                    new TextInputBuilder().setCustomId('target_id').setLabel('Discord ID of the person').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Example: 123456789012345678')
                ),
                new ARB4().addComponents(
                    new TextInputBuilder().setCustomId('points_amount').setLabel('Number of Points').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Example: 10')
                )
            );
            return interaction.showModal(modal);
        }

        // ── إغلاق تكت ───────────────────────────────────────────────────────────
        if (interaction.customId.startsWith('close_ticket_')) {
            try {
                const channelId = interaction.customId.replace('close_ticket_', '');
                const ticket    = await db.getOpenTicketByChannel(channelId);
                const channel   = await client.channels.fetch(channelId).catch(() => null);

                const ticketAdminRole = await db.getConfig('ticket_admin_role');
                const hasRole = ticketAdminRole
                    ? interaction.member.roles.cache.has(ticketAdminRole)
                    : interaction.member.permissions.has(PermissionFlagsBits.Administrator);
                if (!hasRole) {
                    return interaction.reply({ content: '❌ Only ticket admins can close tickets.', flags: 64 });
                }

                const ticketLogId = await db.getConfig('ticket_log_channel');
                if (ticketLogId) {
                    const logCh = await client.channels.fetch(ticketLogId).catch(() => null);
                    if (logCh) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('Ticket Closed')
                            .setColor(0xB71C1C)
                            .addFields(
                                { name: '👤 Owner',    value: ticket ? `<@${ticket.discord_id}>` : '—', inline: true },
                                { name: '🗂️ Type',    value: ticket?.type_name || '—', inline: true },
                                { name: '🔧 Closed by', value: `<@${interaction.user.id}>`, inline: true },
                            ).setTimestamp();
                        await logCh.send({ embeds: [logEmbed] });
                    }
                }

                await db.removeOpenTicket(channelId);
                await interaction.reply({ content: '🔒 Ticket will be closed in 5 seconds...', flags: 64 });
                setTimeout(async () => { if (channel) await channel.delete().catch(() => {}); }, 5000);
            } catch (e) {
                console.error(e);
                if (!interaction.replied && !interaction.deferred)
                    return interaction.reply({ content: '❌ An error occurred.', flags: 64 }).catch(() => {});
            }
        }

        // ── زر البانيك — إرسال الموقع ─────────────────────────────────────────
        if (interaction.customId === 'panic_location_btn') {
            const modal = new ModalBuilder()
                .setCustomId('panic_location_modal')
                .setTitle('Send Distress Location');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('panic_location_text')
                        .setLabel('Where are you now?')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Describe your location in detail...')
                        .setRequired(true)
                        .setMaxLength(500)
                )
            );
            return interaction.showModal(modal).catch(() => {});
        }

        return;
    }

    if (interaction.isStringSelectMenu()) {
        const value = interaction.values[0];

        // ── Reset Menu option selected inside a select menu ─────────────────────
        if (value.startsWith('reset_')) {
            const key = value.replace('reset_', '');
            const commandName = resetCommandMap[key];
            const command = commandName ? client.commands.get(commandName) : null;
            if (command?.slashExecute) {
                try {
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.deferUpdate();
                    }
                    interaction._isReset = true;
                    interaction.reply = async (data) => {
                        if (!data || data?.flags === 64 ||
                            data?.content === '\u200b' || data?.content === '​') return;
                        return interaction.editReply(data);
                    };
                    await command.slashExecute(interaction, db);
                } catch (e) {
                    if (e?.code === 40060 || e?.code === 10062) return;
                    console.error(e);
                    try { if (interaction.deferred) interaction.editReply({ content: '❌ An error occurred.' }); } catch {}
                }
            } else {
                await interaction.deferUpdate().catch(() => {});
            }
            return;
        }

        // ── منيو التفعيل ────────────────────────────────────────────────────────
        if (interaction.customId === 'activation_menu' && value === 'activate_now') {
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder: ARB } = require('discord.js');
            const modal = new ModalBuilder()
                .setCustomId('activation_sony_modal')
                .setTitle('Account Activation Request');
            modal.addComponents(
                new ARB().addComponents(
                    new TextInputBuilder()
                        .setCustomId('sony_id')
                        .setLabel('Enter your Sony ID (PSN)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Example: PlayerName123')
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
                if (!car) return interaction.reply({ content: '❌ Car not found or has been sold.', flags: 64 });
                const embed = new EmbedBuilder()
                    .setTitle(`🚗 ${car.car_name}`)
                    .setColor(0xB71C1C)
                    .addFields(
                        { name: '🏷️ Type',   value: car.car_type ? `\`${car.car_type}\`` : '`Not specified`', inline: true },
                        { name: '🎨 Color',  value: car.color ? `\`${car.color}\`` : '`Not specified`', inline: true },
                        { name: '💰 Price',  value: `\`${Number(car.price).toLocaleString()} Riyals\``, inline: true },
                        { name: '📋 Status', value: '`Available for sale`', inline: true },
                        { name: '📩 To Purchase', value: 'Contact an Admin to complete the purchase', inline: false },
                    )
                    .setFooter({ text: 'Showroom System • FANTASY Bot' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId === 'black_market_menu') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const itemId = parseInt(value);
                const item   = await db.getBlackMarketItemById(itemId);
                if (!item) return interaction.reply({ content: '❌ This item is no longer available.', flags: 64 });

                const embed = new EmbedBuilder()
                    .setTitle(`🖤 ${item.name}`)
                    .setColor(0x1a1a2e)
                    .addFields(
                        { name: '💰 Price', value: `**${Number(item.price).toLocaleString('en-US')}$**`, inline: true },
                    )
                    .setFooter({ text: 'Black Market • FANTASY Bot' })
                    .setTimestamp();

                const buyBtn = new ButtonBuilder()
                    .setCustomId(`buy_bm_${item.id}`)
                    .setLabel(`🛒 Buy ${item.name}`)
                    .setStyle(ButtonStyle.Danger);
                const row = new ActionRowBuilder().addComponents(buyBtn);
                return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId === 'market_item_select') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const itemId = parseInt(value);
                const item   = await db.getMarketItemById(itemId);
                if (!item) return interaction.reply({ content: '❌ This item is no longer available.', flags: 64 });

                const identity = await db.getActiveIdentity(interaction.user.id);
                const cash     = Number(identity?.cash || 0);

                const embed = new EmbedBuilder()
                    .setTitle(`🛒 ${item.name}`)
                    .setColor(0xBF360C)
                    .addFields(
                        { name: '💰 Price',        value: `**${Number(item.price).toLocaleString()} Riyals**`, inline: true },
                        { name: '💵 Your Cash',    value: `${cash.toLocaleString()} Riyals`,                   inline: true },
                    )
                    .setFooter({ text: 'Store System • FANTASY Bot' })
                    .setTimestamp();

                if (item.description) embed.setDescription(`> ${item.description}`);

                if (cash < item.price) {
                    embed.addFields({ name: '❌ Insufficient Balance', value: `You need ${(item.price - cash).toLocaleString()} more Riyals`, inline: false });
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }

                const buyBtn   = new ButtonBuilder().setCustomId(`buy_market_${item.id}`).setLabel(`✅ Confirm Purchase`).setStyle(ButtonStyle.Success);
                return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(buyBtn)], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId === 'equipment_item_select') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const itemId   = parseInt(value);
                const item     = await db.getEquipmentItemById(itemId);
                if (!item) return interaction.reply({ content: '❌ This equipment is no longer available.', flags: 64 });

                const identity = await db.getActiveIdentity(interaction.user.id);
                const cash     = Number(identity?.cash || 0);

                const embed = new EmbedBuilder()
                    .setTitle(`🔨 ${item.name}`)
                    .setColor(0x4527A0)
                    .addFields(
                        { name: '💰 Price',     value: `**${Number(item.price).toLocaleString()} Riyals**`, inline: true },
                        { name: '💵 Your Cash', value: `${cash.toLocaleString()} Riyals`,                   inline: true },
                    )
                    .setFooter({ text: 'Equipment Store • FANTASY Bot' })
                    .setTimestamp();

                if (item.description) embed.setDescription(`> ${item.description}`);

                if (cash < item.price) {
                    embed.addFields({ name: '❌ Insufficient Balance', value: `You need ${(item.price - cash).toLocaleString()} more Riyals`, inline: false });
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }

                const buyBtn   = new ButtonBuilder().setCustomId(`buy_equipment_${item.id}`).setLabel('✅ Confirm Purchase').setStyle(ButtonStyle.Success);
                return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(buyBtn)], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
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
                    const slotNames = { 1: 'Character 1', 2: 'Character 2', 3: 'Character 3' };
                    const slotOptions = [1, 2, 3].map(s => {
                        if (s === 3 && !slot3Open) {
                            return { label: '🔒 Character 3', value: `create_slot_${s}`, description: 'Locked — contact admins to unlock' };
                        }
                        const taken = identities.find(i => i.slot === s && i.character_name);
                        return {
                            label: slotNames[s],
                            value: `create_slot_${s}`,
                            description: taken ? '🔒 Already filled' : '🟢 Available to create',
                        };
                    });
                    const slotRow = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('identity_create_slot')
                            .setPlaceholder('Choose a character slot')
                            .addOptions(slotOptions)
                    );
                    return interaction.reply({ content: '📋 **Choose the character you want to create an identity for:**', components: [slotRow], flags: 64 });
                }

                if (value === 'login_identity') {
                    const tripOpen = await db.getConfig('trip_open');
                    if (tripOpen !== 'true') {
                        return interaction.reply({ content: '❌ **Login is currently closed.**\nYou can only log in when a trip is open. Wait for an admin announcement.', flags: 64 });
                    }
                    const identities = await db.getUserIdentities(interaction.user.id);
                    const created = identities.filter(i => i.character_name);
                    if (!created.length) return interaction.reply({ content: '❌ No created and approved characters yet. Submit an identity request first.', flags: 64 });
                    const loginSlotNames = { 1: 'Character 1', 2: 'Character 2', 3: 'Character 3' };
                    const slotOptions = created.map(i => ({
                        label: `${loginSlotNames[i.slot]}: ${i.character_name} ${i.family_name || ''}`,
                        value: `login_slot_${i.slot}`,
                        description: `${i.gender || '—'} • ${i.birth_date || '—'}`,
                    }));
                    const slotRow = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('identity_login_slot')
                            .setPlaceholder('Choose a character to log in with')
                            .addOptions(slotOptions)
                    );
                    return interaction.reply({ content: '✅ **Choose the character you want to log in with:**', components: [slotRow], flags: 64 });
                }

                if (value === 'logout_identity') {
                    const status = await db.getLoginStatus(interaction.user.id);
                    if (!status.is_logged_in) return interaction.reply({ content: '❌ You are not currently logged in with any character.', flags: 64 });
                    const identities = await db.getUserIdentities(interaction.user.id);
                    const activeChar = identities.find(i => i.slot === status.active_slot);
                    const slotNamesOut = { 1: 'Character 1', 2: 'Character 2', 3: 'Character 3' };
                    await db.logoutIdentity(interaction.user.id);
                    await db.addCharacterLog(interaction.user.id, interaction.user.username, 'logout', activeChar?.character_name || null, status.active_slot);
                    const embedOut = new EmbedBuilder()
                        .setTitle('Logout')
                        .setColor(0x757575)
                        .addFields(
                            { name: '👤 User',      value: `<@${interaction.user.id}>`, inline: true },
                            { name: '🪪 Character', value: `${slotNamesOut[status.active_slot] || `Character ${status.active_slot}`}: **${activeChar?.character_name || '—'} ${activeChar?.family_name || ''}**`, inline: true },
                        )
                        .setFooter({ text: 'Identity System • FANTASY Bot' })
                        .setTimestamp();
                    sendToCharLog(embedOut);
                    return interaction.reply({ embeds: [embedOut], flags: 64 });
                }
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId === 'identity_create_slot') {
            const slot = parseInt(value.replace('create_slot_', ''));
            const NAMES = ['', 'Character 1', 'Character 2', 'Character 3'];
            if (slot === 3) {
                const unlocked = await db.isSlot3Unlocked(interaction.user.id);
                if (!unlocked) return interaction.reply({ content: '🔒 **Character 3** is not unlocked. Contact admins to unlock it.', flags: 64 });
            }
            const identities = await db.getUserIdentities(interaction.user.id);
            const taken = identities.find(i => i.slot === slot && i.character_name);
            if (taken) {
                return interaction.reply({ content: `❌ **${NAMES[slot]}** is already filled and a new identity cannot be created in it.`, flags: 64 });
            }
            const slotNames = { 1: 'Character 1', 2: 'Character 2', 3: 'Character 3' };
            const modal = new ModalBuilder()
                .setCustomId(`create_char_${slot}`)
                .setTitle(`✏️ Create Identity — ${slotNames[slot]}`)
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('char_name').setLabel('Character Name')
                            .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('family_name').setLabel('Family Name')
                            .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('birth_place').setLabel('Name & Place of Birth')
                            .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('birth_date').setLabel('Date of Birth (e.g. 1990/06/15)')
                            .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('gender').setLabel('Gender (Male / Female)')
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
                if (!char || !char.character_name) return interaction.reply({ content: '❌ This character is not approved or incomplete. Cannot log in with it.', flags: 64 });
                await db.loginIdentity(interaction.user.id, slot);
                await db.addCharacterLog(interaction.user.id, interaction.user.username, 'login', char.character_name, slot);
                const slotNamesLogin = { 1: 'Character 1', 2: 'Character 2', 3: 'Character 3' };
                const embed = new EmbedBuilder()
                    .setTitle(`✅ Login — ${slotNamesLogin[slot]}`)
                    .setColor(0x2E7D32)
                    .addFields(
                        { name: '👤 Name',            value: `${char.character_name} ${char.family_name || ''}`, inline: true },
                        { name: '⚧ Gender',           value: char.gender || '—', inline: true },
                        { name: '📅 Date of Birth',   value: char.birth_date || '—', inline: true },
                        { name: '📍 Place of Birth',  value: char.birth_place || '—', inline: true },
                        { name: '👤 User',             value: `<@${interaction.user.id}>`, inline: true },
                    )
                    .setFooter({ text: 'Identity System • FANTASY Bot' })
                    .setTimestamp();
                sendToCharLog(embed);
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'An error occurred during login.', flags: 64 });
            }
        }

        if (interaction.customId === 'properties_menu') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const propId = parseInt(value);
                const prop = await db.getPropertyById(propId);
                if (!prop) return interaction.reply({ content: '❌ This property is no longer available.', flags: 64 });

                const embed = new EmbedBuilder()
                    .setTitle(`🏠 ${prop.name}`)
                    .setColor(0xB71C1C)
                    .addFields(
                        { name: '💰 Price', value: `\`${Number(prop.price).toLocaleString()} Riyals\``, inline: true },
                    )
                    .setDescription('Do you want to purchase this property? Click the purchase button below.\n> The amount will be deducted from your cash and the property details will be sent to your DMs.')
                    .setFooter({ text: 'Properties System • FANTASY Bot' })
                    .setTimestamp();
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`buy_property_${prop.id}`)
                        .setLabel(`Buy ${prop.name}`)
                        .setStyle(ButtonStyle.Danger),
                );
                return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId === 'ticket_menu') {
            return interaction.reply({
                content: '⚠️ This menu is outdated. Please use the new panel `/tickets` to open a ticket.',
                flags: 64
            });
        }

        if (interaction.customId === 'tickets_type_menu') {
            if (value.startsWith('reset_')) {
                const key = value.replace('reset_', '');
                const command = client.commands.get(key);
                if (command?.slashExecute) {
                    await interaction.deferUpdate().catch(() => {});
                    interaction.reply = async (data) => {
                        if (!data || data?.flags === 64) return;
                        return interaction.editReply(data);
                    };
                    return command.slashExecute(interaction, db);
                }
                return interaction.deferUpdate().catch(() => {});
            }
            return handleOpenTicket(interaction, value);
        }

        // ── ملف المواطن — اختيار من القائمة ─────────────────────────────────────
        if (interaction.customId.startsWith('citizen_file_select:')) {
            const chefRoleId = await db.getConfig('cia_chef_role');
            if (!chefRoleId || !interaction.member.roles.cache.has(chefRoleId))
                return interaction.reply({ content: '❌ Unauthorized.', flags: 64 });
            try {
                await interaction.deferUpdate();
                const page = parseInt(interaction.customId.split(':')[1]) || 0;
                const [discordId, slot] = value.split(':');
                const { buildCitizenEmbed } = require('./commands/citizen-file');
                const embed = await buildCitizenEmbed(db, discordId, parseInt(slot));
                if (!embed) {
                    await interaction.message.edit({ content: '❌ No data found for this citizen.', embeds: [], components: [] });
                    return;
                }
                const backBtn = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`citizen_file_back:${page}`)
                        .setLabel('Back to Menu')
                        .setEmoji('◀️')
                        .setStyle(ButtonStyle.Secondary)
                );
                await interaction.message.edit({ embeds: [embed], components: [backBtn] });
            } catch (e) {
                console.error('[CITIZEN FILE SELECT]', e);
            }
            return;
        }

        if (interaction.customId === 'robbery_menu') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const robberyId = parseInt(value);
                const rob = await db.getRobberyById(robberyId);
                if (!rob) return interaction.reply({ content: '❌ This robbery option is no longer available.', flags: 64 });

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
                        .setTitle('Missing Tools')
                        .setColor(0xB71C1C)
                        .setDescription(`You do not have the required tools to execute **${rob.name}**:`)
                        .addFields({ name: '🛠️ Missing Tools', value: missing.map(t => `• \`${t}\``).join('\n'), inline: false })
                        .setFooter({ text: 'Robbery System • FANTASY Bot' })
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

                const reportChannelId = await db.getConfig('robbery_report_channel');
                if (reportChannelId) {
                    const { ModalBuilder: RM, TextInputBuilder: RT, TextInputStyle: RS, ActionRowBuilder: RA } = require('discord.js');
                    const modal = new RM()
                        .setCustomId(`robbery_report_${robberyId}_${amount}`)
                        .setTitle('Robbery Location Report');
                    modal.addComponents(
                        new RA().addComponents(
                            new RT().setCustomId('robbery_location').setLabel('Where are you? (Write your location)').setStyle(RS.Paragraph).setRequired(true).setMaxLength(500)
                        ),
                    );
                    return interaction.showModal(modal);
                }

                const embed = new EmbedBuilder()
                    .setTitle('Robbery Successful!')
                    .setColor(0x2E7D32)
                    .addFields(
                        { name: '🔫 Robbery Type',   value: rob.name, inline: true },
                        { name: '💵 Amount Stolen',   value: `\`${amount.toLocaleString()} Riyals\``, inline: true },
                        { name: '🛠️ Tools Used',      value: toolsList ? toolsList.map(t => `\`${t}\``).join(', ') : '`None`', inline: false },
                    )
                    .setFooter({ text: 'Robbery System • FANTASY Bot' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed] , flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'An error occurred while executing the robbery.', flags: 64 });
            }
        }

        if (interaction.customId === 'snap_menu') {
            try {
                const { ModalBuilder: MN, TextInputBuilder: TIN, TextInputStyle: TSN, ActionRowBuilder: ARN, StringSelectMenuBuilder: SSN } = require('discord.js');
                await db.ensureUser(interaction.user.id, interaction.user.username);
                { const _e = await db.checkLoginAndIdentity(interaction.user.id); if (_e) return interaction.reply({ content: _e, flags: 64 }); }
                const acc = await db.getSnapAccount(interaction.user.id);
                if (!acc) return interaction.reply({ content: '❌ You do not have a Snap account.', flags: 64 });

                if (value === 'snap_send') {
                    const friends = await db.getSnapFriends(interaction.user.id);
                    if (!friends.length) return interaction.reply({ content: '❌ You have no friends yet. Add a friend first.', flags: 64 });
                    const options = friends.slice(0, 25).map(f => ({
                        label: f.friend_username,
                        value: f.friend_id,
                        description: `🔥 Streak: ${f.streak}`,
                    }));
                    const row = new ARN().addComponents(
                        new SSN().setCustomId('snap_friend_select').setPlaceholder('👻 Choose a friend to send a snap to').addOptions(options)
                    );
                    return interaction.reply({ content: '📸 **Choose the friend you want to send a snap to:**', components: [row], flags: 64 });
                }

                if (value === 'snap_inbox') {
                    const msgs = await db.getSnapInbox(interaction.user.id);
                    const embed = new EmbedBuilder()
                        .setTitle('Snap Inbox')
                        .setColor(0xFFFC00)
                        .setFooter({ text: 'Snapchat • FANTASY Bot' })
                        .setTimestamp();
                    if (!msgs.length) {
                        embed.setDescription('> 📭 No incoming snaps');
                    } else {
                        const unseen = msgs.filter(m => !m.seen);
                        embed.setDescription(`📩 **${unseen.length}** new unread snap(s)`);
                        msgs.slice(0, 10).forEach(m => embed.addFields({
                            name: `${m.seen ? '📖' : '🔴'} From: **${m.sender_username}**`,
                            value: `> ${m.content}\n⏰ ${new Date(m.created_at).toLocaleString('en-US')}`,
                            inline: false,
                        }));
                        for (const m of msgs.filter(m => !m.seen)) await db.markSnapSeen(m.id, interaction.user.id);
                    }
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }

                if (value === 'snap_friends') {
                    const friends = await db.getSnapFriends(interaction.user.id);
                    const embed = new EmbedBuilder()
                        .setTitle('My Snap Friends')
                        .setColor(0xFFFC00)
                        .setFooter({ text: `${friends.length} friend(s) • Snapchat • FANTASY Bot` })
                        .setTimestamp();
                    if (!friends.length) {
                        embed.setDescription('> No friends yet. Choose **➕ Add Friend**');
                        return interaction.reply({ embeds: [embed], flags: 64 });
                    }
                    const SPACER = { name: '\u200b', value: '\u200b', inline: true };
                    const fields = friends.map(f => {
                        const s = f.streak;
                        const badge = s >= 100 ? '💯' : s >= 50 ? '🏆' : s >= 10 ? '⚡' : '🔥';
                        return { name: `👻 ${f.friend_username}`, value: `${badge} **${s}** streak`, inline: true };
                    });
                    while (fields.length % 3 !== 0) fields.push(SPACER);
                    embed.addFields(fields);
                    const msgRow = new ARN().addComponents(
                        new SSN().setCustomId('snap_friend_select')
                            .setPlaceholder('💬 Choose a friend to message')
                            .addOptions(friends.slice(0, 25).map(f => ({
                                label: f.friend_username,
                                value: f.friend_id,
                                description: `🔥 Streak: ${f.streak}`,
                            })))
                    );
                    return interaction.reply({ embeds: [embed], components: [msgRow], flags: 64 });
                }

                if (value === 'snap_add') {
                    const modal = new MN().setCustomId('snap_add_modal').setTitle('Add Friend')
                        .addComponents(new ARN().addComponents(
                            new TIN().setCustomId('friend_snap_name').setLabel('Friend\'s Snap username')
                                .setStyle(TSN.Short).setRequired(true).setMaxLength(20)
                                .setPlaceholder('Example: Sultan2025')
                        ));
                    return interaction.showModal(modal);
                }

                if (value === 'snap_requests') {
                    const requests = await db.getPendingSnapRequests(interaction.user.id);
                    const embed = new EmbedBuilder()
                        .setTitle('Incoming Friend Requests')
                        .setColor(0xFFFC00)
                        .setFooter({ text: 'Snapchat • FANTASY Bot' })
                        .setTimestamp();
                    if (!requests.length) {
                        embed.setDescription('> No pending friend requests.');
                        return interaction.reply({ embeds: [embed], flags: 64 });
                    }
                    embed.setDescription(`📩 **${requests.length}** friend request(s)`);
                    const options = requests.slice(0, 25).map(r => ({
                        label: r.requester_username,
                        value: r.requester_id,
                        description: 'Click to accept',
                    }));
                    const row = new ARN().addComponents(
                        new SSN().setCustomId('snap_accept_select').setPlaceholder('✅ Choose a request to accept').addOptions(options)
                    );
                    return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
                }
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId === 'snap_friend_select') {
            try {
                const friendId  = value;
                const myAcc     = await db.getSnapAccount(interaction.user.id);
                const friendAcc = await db.getSnapAccount(friendId);
                if (!friendAcc) return interaction.reply({ content: '❌ Friend account not found.', flags: 64 });

                const msgs = await db.getSnapConversation(interaction.user.id, friendId);

                const embed = new EmbedBuilder()
                    .setTitle(`💬 Your conversation with @${friendAcc.snap_username}`)
                    .setColor(0xFFFC00)
                    .setFooter({ text: 'Snapchat • FANTASY Bot' })
                    .setTimestamp();

                if (!msgs.length) {
                    embed.setDescription('> No messages yet. Start the conversation now!');
                } else {
                    embed.setDescription(
                        msgs.map(m => {
                            const isMe = m.sender_id === interaction.user.id;
                            const time = new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                            return `${isMe ? '📤 **You**' : `📥 **@${m.sender_username}**`} — ${time}\n> ${m.content}`;
                        }).join('\n\n')
                    );
                }

                const sendBtn  = new ButtonBuilder().setCustomId(`snap_msg_btn_${friendId}`).setLabel('📸 Send Message').setStyle(ButtonStyle.Primary);
                const row = new ActionRowBuilder().addComponents(sendBtn);
                return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId.startsWith('snap_msg_btn_')) {
            try {
                const friendId  = interaction.customId.replace('snap_msg_btn_', '');
                const friendAcc = await db.getSnapAccount(friendId);
                const modal = new ModalBuilder()
                    .setCustomId(`snap_send_modal_${friendId}`)
                    .setTitle(`📸 Message to @${friendAcc?.snap_username || 'friend'}`)
                    .addComponents(new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('snap_content').setLabel('Message text')
                            .setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(300)
                    ));
                return interaction.showModal(modal);
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId === 'snap_accept_select') {
            try {
                const requesterId = value;
                const requesterAcc = await db.getSnapAccount(requesterId);
                const done = await db.acceptSnapFriend(interaction.user.id, requesterId);
                if (!done) return interaction.reply({ content: '❌ Request not found.', flags: 64 });
                const embed = new EmbedBuilder()
                    .setTitle('Friend Request Accepted')
                    .setColor(0xFFFC00)
                    .setDescription(`You are now friends with **${requesterAcc?.snap_username || requesterId}** 👻`)
                    .setFooter({ text: 'Snapchat • FANTASY Bot' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId === 'bag_use_select') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const itemName = value.replace(/^use_/, '');
                const result = await db.useItem(interaction.user.id, itemName);
                if (!result.success) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });
                const embed = new EmbedBuilder()
                    .setTitle('Item Used')
                    .setColor(0x2E7D32)
                    .addFields(
                        { name: '🎒 Item',               value: `**${itemName}**`, inline: true },
                        { name: '📦 Remaining Quantity', value: `\`${result.remainingQty}\``, inline: true },
                    )
                    .setFooter({ text: 'Bag System • FANTASY Bot' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: 'An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId === 'vehicles_menu') {
            if (value === 'view') {
                try {
                    await db.ensureUser(interaction.user.id, interaction.user.username);
                    const cars = await db.getVehicles(interaction.user.id);
                    const embed = new EmbedBuilder()
                        .setTitle('My Registered Cars')
                        .setColor(0x37474F)
                        .setDescription(cars.length
                            ? cars.map(c => `🚗 **${c.car_name}** — Plate: \`${c.plate}\``).join('\n')
                            : '> No registered cars yet')
                        .addFields({ name: '🔢 Number of Cars', value: `\`${cars.length}\``, inline: true })
                        .setFooter({ text: 'Vehicles System • FANTASY Bot' })
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], flags: 64 });
                } catch (e) {
                    console.error(e);
                    return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
                }
            }
        }


        // ── أزرار X Platform (إعجاب / رتويت / رد) ─────────────────────────────────
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
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        if (interaction.customId.startsWith('x_retweet_')) {
            try {
                const postId = parseInt(interaction.customId.replace('x_retweet_', ''));
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const myAcc = await db.getXAccount(interaction.user.id);
                if (!myAcc) return interaction.reply({ content: '❌ You do not have an X Platform account.', flags: 64 });
                const xChannelId = await db.getConfig('x_channel');
                if (!xChannelId) return interaction.reply({ content: '❌ The tweets channel has not been configured.', flags: 64 });
                const orig = await db.getPostById(postId);
                if (!orig) return interaction.reply({ content: '❌ Tweet not found.', flags: 64 });
                const rt = await db.retweetPost(interaction.user.id, postId);
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `@${myAcc.x_username} 🔁 Retweet`, iconURL: interaction.user.displayAvatarURL() })
                    .setColor(0x1DA1F2)
                    .setDescription(orig.content)
                    .addFields(
                        { name: '↩️ Retweeted from', value: `@${orig.x_username}`, inline: true },
                        { name: '🆔 Post ID',         value: `\`#${rt.id}\``, inline: true },
                    )
                    .setFooter({ text: 'X Platform • FANTASY Bot' })
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
                return interaction.followUp({ content: `✅ Retweeted in <#${xChannelId}>`, flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        if (interaction.customId.startsWith('x_reply_')) {
            try {
                const postId = parseInt(interaction.customId.replace('x_reply_', ''));
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const myAcc = await db.getXAccount(interaction.user.id);
                if (!myAcc) return interaction.reply({ content: '❌ You do not have an X Platform account.', flags: 64 });
                const { ModalBuilder: MBR, TextInputBuilder: TIBR, TextInputStyle: TISR, ActionRowBuilder: ARBR } = require('discord.js');
                const modal = new MBR().setCustomId(`x_reply_modal_${postId}`).setTitle('Reply to Tweet')
                    .addComponents(new ARBR().addComponents(
                        new TIBR().setCustomId('reply_content').setLabel('Your reply text')
                            .setStyle(TISR.Paragraph).setRequired(true).setMaxLength(280)
                    ));
                return interaction.showModal(modal);
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }


        // ── Law ──────────────────────────────────────────────────────────
        if (interaction.customId === 'law_menu') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                if (value === 'new_case') {
                    const modal = new ModalBuilder().setCustomId('new_case_modal').setTitle('File a New Case');
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('case_title').setLabel('Case Title').setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('case_defendant').setLabel('Defendant').setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('case_desc').setLabel('Case Description').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('case_evidence').setLabel('Evidence (optional)').setStyle(TextInputStyle.Paragraph).setRequired(false)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('case_lawyer_fee').setLabel('Lawyer Fee (optional)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('Example: 5000$')),
                    );
                    return interaction.showModal(modal);
                }

                if (value === 'my_cases') {
                    const cases = await db.getCasesByPlaintiff(interaction.user.id);
                    if (!cases.length) return interaction.reply({ content: '📋 No cases filed under your name.', flags: 64 });
                    const lines = cases.map(c =>
                        `**[${c.case_number}]** ${c.title}\n> vs: ${c.defendant} • Status: ${db.CASE_STATUS[c.status] || c.status}${c.lawyer_name ? ` • Lawyer: ${c.lawyer_name}` : ''}${c.judge_name ? ` • Judge: ${c.judge_name}` : ''}`
                    ).join('\n\n');
                    const embed = new EmbedBuilder()
                        .setTitle('My Cases')
                        .setColor(0x0D47A1)
                        .setDescription(lines.slice(0, 4000))
                        .setFooter({ text: `Total Cases: ${cases.length} • FANTASY Bot` })
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }

                if (value === 'hire_lawyer') {
                    const lawyers = await db.getLawyers();
                    if (!lawyers.length) return interaction.reply({ content: '❌ No certified lawyers available currently. Contact an Admin.', flags: 64 });
                    const cases = await db.getCasesByPlaintiff(interaction.user.id);
                    const eligible = cases.filter(c => ['pending','accepted','in_progress'].includes(c.status));
                    if (!eligible.length) return interaction.reply({ content: '❌ No open cases filed under your name.', flags: 64 });
                    const sel = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder().setCustomId('case_sel_lawyer').setPlaceholder('📁 First: choose the case')
                            .addOptions(eligible.slice(0,25).map(c => ({ label: `${c.case_number} — ${c.title}`, value: String(c.id), description: `Status: ${db.CASE_STATUS[c.status]}` })))
                    );
                    return interaction.reply({ content: '👨‍⚖️ **Step 1:** Choose the case:', components: [sel], flags: 64 });
                }
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        // ── العدل ─────────────────────────────────────────────────────────────
        if (interaction.customId === 'justice_menu') {
            try {
                const { isAdmin } = require('./utils');
                if (!(await isAdmin(interaction.member, db)))
                    return interaction.reply({ content: '❌ Admins only.', flags: 64 });

                const actionMap = {
                    accept_case:   { statuses: ['pending'],     label: '✅ Choose the case to accept',        customId: 'case_sel_accept' },
                    reject_case:   { statuses: ['pending'],     label: '❌ Choose the case to reject',         customId: 'case_sel_reject' },
                    assign_judge:  { statuses: ['accepted'],    label: '👨‍⚖️ Choose the case to assign a judge', customId: 'case_sel_judge' },
                    issue_verdict: { statuses: ['in_progress'], label: '📜 Choose the case to issue a verdict', customId: 'case_sel_verdict' },
                };
                const cfg = actionMap[value];
                if (!cfg) return;

                let cases = [];
                for (const st of cfg.statuses) cases.push(...await db.getCasesByStatus(st));
                if (!cases.length) return interaction.reply({ content: '📋 No cases in this status.', flags: 64 });

                const sel = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder().setCustomId(cfg.customId).setPlaceholder('Choose a case')
                        .addOptions(cases.slice(0,25).map(c => ({ label: `${c.case_number} — ${c.title}`, value: String(c.id), description: `vs: ${c.defendant} • ${db.CASE_STATUS[c.status]}` })))
                );
                return interaction.reply({ content: cfg.label + ':', components: [sel], flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        // ── Accept case directly ─────────────────────────────────────────────────
        if (interaction.customId === 'case_sel_accept') {
            try {
                const c = await db.getCaseById(Number(value));
                if (!c) return interaction.reply({ content: '❌ Case not found.', flags: 64 });
                await db.acceptCase(c.id);
                const embed = new EmbedBuilder()
                    .setTitle('Case Accepted')
                    .setColor(0x2E7D32)
                    .addFields(
                        { name: '📁 Case Number', value: c.case_number,          inline: true },
                        { name: '📌 Title',       value: c.title,                 inline: true },
                        { name: '👤 Plaintiff',   value: `<@${c.plaintiff_id}>`, inline: true },
                        { name: '⚔️ Defendant',   value: c.defendant,            inline: true },
                    )
                    .setFooter({ text: `Accepted by: ${interaction.user.username} • FANTASY Bot` })
                    .setTimestamp();

                // DM the plaintiff
                try {
                    const plaintiff = await interaction.client.users.fetch(c.plaintiff_id);
                    const dmEmbed = new EmbedBuilder().setTitle('Your Case Has Been Accepted').setColor(0x2E7D32)
                        .setDescription(`**${c.case_number} — ${c.title}**\n\nYour case has been accepted and will be processed soon.`)
                        .setFooter({ text: 'Law System • FANTASY Bot' }).setTimestamp();
                    await plaintiff.send({ embeds: [dmEmbed] });
                } catch (_) {}
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        // ── judge_select: show selected judge's dashboard publicly ────────────────────
        if (interaction.customId === 'judge_select') {
            try {
                const { buildJudgeDashboard } = require('./commands/judge-dashboard');
                const judges = await db.getJudges();
                const judge  = judges.find(j => j.discord_id === value);
                if (!judge) return interaction.reply({ content: '❌ Judge not found.', flags: 64 });
                await interaction.channel.send(await buildJudgeDashboard(db, judge.discord_id, judge.judge_name));
                return interaction.reply({ content: '\u200b', flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        // ── lawyer_select: show selected lawyer's dashboard publicly ──────────────────
        if (interaction.customId === 'lawyer_select') {
            try {
                const { buildDashboard } = require('./commands/lawyer-dashboard');
                const lawyers = await db.getLawyers();
                const lawyer  = lawyers.find(l => l.discord_id === value);
                if (!lawyer) return interaction.reply({ content: '❌ Lawyer not found.', flags: 64 });
                await interaction.channel.send(await buildDashboard(db, lawyer.discord_id, lawyer.lawyer_name));
                return interaction.reply({ content: '\u200b', flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        // ── lawyer_tasks_select: private tasks dashboard — owner only ──────────
        if (interaction.customId === 'lawyer_tasks_select') {
            try {
                const selectedId = value;
                if (interaction.user.id !== selectedId)
                    return interaction.reply({ content: '❌ You cannot access another lawyer\'s dashboard.', flags: 64 });

                const lawyers = await db.getLawyers();
                const lawyer  = lawyers.find(l => l.discord_id === selectedId);
                if (!lawyer)
                    return interaction.reply({ content: '❌ You are not registered as a certified lawyer.', flags: 64 });

                const { buildTasks } = require('./commands/lawyer-tasks');
                const dash = await buildTasks(db, lawyer.discord_id, lawyer.lawyer_name);
                return interaction.reply({ ...dash, flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        // ── case_sel_lawyer: after choosing the case, show lawyer list ────────
        if (interaction.customId === 'case_sel_lawyer') {
            try {
                const caseId = value;
                const lawyers = await db.getLawyers();
                if (!lawyers.length) return interaction.reply({ content: '❌ No certified lawyers available.', flags: 64 });
                const sel = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder().setCustomId(`lawyer_pick_${caseId}`).setPlaceholder('👨‍⚖️ Step 2: Choose a lawyer')
                        .addOptions(lawyers.slice(0,25).map(l => ({ label: l.lawyer_name, value: l.discord_id, description: `ID: ${l.discord_id}` })))
                );
                return interaction.reply({ content: '👨‍⚖️ **Step 2:** Choose a lawyer:', components: [sel], flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        // ── lawyer_pick_{caseId}: send power of attorney request to lawyer ──────────────────
        if (interaction.customId.startsWith('lawyer_pick_')) {
            try {
                const caseId   = Number(interaction.customId.replace('lawyer_pick_', ''));
                const lawyerId = value;
                const lawyers  = await db.getLawyers();
                const lawyer   = lawyers.find(l => l.discord_id === lawyerId);
                const c        = await db.getCaseById(caseId);
                if (!c) return interaction.reply({ content: '❌ Case not found.', flags: 64 });
                if (!lawyer) return interaction.reply({ content: '❌ Lawyer not found.', flags: 64 });

                await db.createLawyerRequest(caseId, c.case_number, c.title, interaction.user.id, c.plaintiff_name, lawyerId);

                // Notify lawyer via DM
                try {
                    const lawyerUser = await interaction.client.users.fetch(lawyerId);
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('New Power of Attorney Request')
                        .setColor(0x0D47A1)
                        .setDescription('> You have a new power of attorney request — use `/محامي` to accept or reject')
                        .addFields(
                            { name: '🔢 Case Number', value: c.case_number,    inline: true },
                            { name: '📌 Title',        value: c.title,          inline: true },
                            { name: '👤 Client',       value: c.plaintiff_name, inline: true },
                        )
                        .setFooter({ text: 'Law System • FANTASY Bot' }).setTimestamp();
                    await lawyerUser.send({ embeds: [dmEmbed] });
                } catch (_) {}

                const embed = new EmbedBuilder()
                    .setTitle('Power of Attorney Sent')
                    .setColor(0x0D47A1)
                    .setDescription(`> The power of attorney request has been sent to **${lawyer.lawyer_name}**\nThey will be notified via DM and can accept or reject via \`/محامي\``)
                    .addFields(
                        { name: '🔢 Case Number', value: c.case_number, inline: true },
                        { name: '📌 Title',        value: c.title,       inline: true },
                    )
                    .setFooter({ text: 'Law System • FANTASY Bot' }).setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        if (['case_sel_reject','case_sel_judge','case_sel_verdict'].includes(interaction.customId)) {
            try {
                const caseId = value;
                const modals = {
                    case_sel_reject:  { id: `case_reject_modal_${caseId}`,  title: '❌ Reason for Rejection', fields: [{ id: 'reason',       label: 'Reason for rejecting the case',  long: true  }] },
                    case_sel_judge:   { id: `case_judge_modal_${caseId}`,   title: '👨‍⚖️ Assign a Judge',    fields: [{ id: 'judge_mention', label: 'Judge name (or mention)',         long: false }] },
                    case_sel_verdict: { id: `case_verdict_modal_${caseId}`, title: '📜 Issue Verdict',        fields: [{ id: 'verdict',       label: 'Verdict text',                   long: true  }] },
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
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        if (interaction.customId === 'phone_menu') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const err = await db.checkLoginAndIdentity(interaction.user.id);
                if (err) return interaction.reply({ content: err, flags: 64 });

                const isPolice = value === 'report_police';
                const modal = new ModalBuilder()
                    .setCustomId(isPolice ? 'report_police_modal' : 'report_ambulance_modal')
                    .setTitle(isPolice ? '🚨 Police Report' : '🚑 Ambulance Report');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('report_location').setLabel('Location').setStyle(TextInputStyle.Short).setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('report_details').setLabel('Report details').setStyle(TextInputStyle.Paragraph).setRequired(true)
                    ),
                );
                return interaction.showModal(modal);
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId === 'central_market_sell') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const loginErr = await db.checkLoginAndIdentity(interaction.user.id);
                if (loginErr) return interaction.reply({ content: loginErr, flags: 64 });

                const identity = await db.getActiveIdentity(interaction.user.id);
                if (!identity) return interaction.reply({ content: 'You are not logged in. Please log in first.', flags: 64 });

                let result;
                if (value === 'all') {
                    result = await db.sellJobItems(interaction.user.id);
                } else {
                    result = await db.sellJobItemsByCategory(interaction.user.id, value);
                }

                const { totalValue, sold } = result;
                if (!sold.length) return interaction.reply({ content: '❌ You have no earnings from this category in your bag.', flags: 64 });

                await db.addToCash(interaction.user.id, identity.slot, totalValue);

                const catLabel = { fishing: '🎣 Fish', woodcutting: '🪓 Lumber', mining: '⛏️ Minerals', all: '💰 All' };
                const lines = sold.map(s =>
                    `• **${s.name}** × ${s.qty} — ${s.price.toLocaleString()} Riyals/unit = **${s.value.toLocaleString()} Riyals**`
                ).join('\n');

                const embed = new EmbedBuilder()
                    .setTitle(`✅ Sale Completed — ${catLabel[value] || ''}`)
                    .setColor(0x00796B)
                    .setDescription(lines)
                    .addFields(
                        { name: '💵 Total Collected', value: `**${totalValue.toLocaleString()} Riyals**`, inline: false },
                    )
                    .setFooter({ text: 'Central Market • FANTASY Bot' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId === 'jobs_menu') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const loginErr = await db.checkLoginAndIdentity(interaction.user.id);
                if (loginErr) return interaction.reply({ content: loginErr, flags: 64 });

                const prices = await db.getJobPrices();

                const jobMap = {
                    fishing:     { label: '🎣 Fishing',    req: 'سنارة',    items: ['سمك هامور','سالمون','روبيان','حوت'], weights: [20,35,40,5], color: 0x1565C0 },
                    woodcutting: { label: '🪓 Woodcutting',  req: 'فأس',      items: ['خشب'],                             weights: [100],       color: 0x4E342E },
                    mining:      { label: '⛏️ Mining',        req: 'أدوات المنجم',   items: ['الماس','ذهب','فضة','نحاس'],      weights: [5,20,35,40], color: 0x546E7A },
                };

                const job = jobMap[value];
                if (!job) return;

                const priceLines = job.items.map(it => `• **${it}:** ${(prices[it]||0).toLocaleString()} Riyals`).join('\n');
                const embed = new EmbedBuilder()
                    .setTitle(job.label)
                    .setColor(job.color)
                    .addFields(
                        { name: '🎒 Required',       value: job.req,          inline: true },
                        { name: '📦 Quantity',        value: '1 – 10 random',  inline: true },
                        { name: '💹 Current Prices',  value: priceLines,        inline: false },
                    )
                    .setFooter({ text: 'Jobs System • FANTASY Bot' }).setTimestamp();

                const startBtn  = new ButtonBuilder().setCustomId(`do_job_${value}`).setLabel('▶️ Start').setStyle(ButtonStyle.Success);
                return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(startBtn)], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
        }

        // ── تصنيع السلاح ───────────────────────────────────────────────────────────
        if (interaction.customId === 'craft_weapon') {
            try {
                const identity = await db.getActiveIdentity(interaction.user.id);
                if (!identity) return interaction.reply({ content: 'You are not logged in. Please log in first.', flags: 64 });

                const CRAFT_RESOURCES = ['ألمنيوم', 'حديد', 'خشب', 'أربطة', 'مسامير'];
                const CRAFT_WEAPONS = {
                    craft_sns:     { name: 'Pistol SNS',    req: 200 },
                    craft_vintage: { name: 'Pistol Vintage', req: 300 },
                    craft_mkii:    { name: 'Pistol MK II',   req: 500 },
                };
                const weapon = CRAFT_WEAPONS[value];
                if (!weapon) return interaction.reply({ content: '❌ Invalid option.', flags: 65 });

                const missing = [];
                for (const res of CRAFT_RESOURCES) {
                    const qty = await db.getItemQty(interaction.user.id, res);
                    if (qty < weapon.req) missing.push(`> ${res}: You have **${qty}** / Need **${weapon.req}**`);
                }

                if (missing.length) {
                    return interaction.reply({
                        content: `❌ **You do not have enough resources to craft ${weapon.name}**\n${missing.join('\n')}`,
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
                    `🔫 **${displayName}** successfully crafted **${weapon.name}** and added it to their bag!`
                );
            } catch (e) {
                console.error(e);
                interaction.reply({ content: '❌ An error occurred during crafting.', flags: 65 }).catch(() => {});
            }
            return;
        }

        // ── اختيار شركة من السوق (شراء/بيع) ────────────────────────────────────
        if (interaction.customId === 'stock_company_select:buy' || interaction.customId === 'stock_company_select:sell') {
            try {
                const loginErr = await db.checkLoginAndIdentity(interaction.user.id);
                if (loginErr) return interaction.reply({ content: loginErr, flags: 64 });

                const isBuy = interaction.customId === 'stock_company_select:buy';
                const companyId = interaction.values[0];

                const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
                const modal = new ModalBuilder()
                    .setCustomId(`stock_shares_modal:${isBuy ? 'buy' : 'sell'}:${companyId}`)
                    .setTitle(isBuy ? '📈 Buy Shares' : '📉 Sell Shares');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('stock_shares')
                            .setLabel('Number of shares')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Example: 10')
                            .setRequired(true)
                    )
                );
                return interaction.showModal(modal);
            } catch (e) {
                console.error('[STOCK SELECT ERROR]', e);
                if (!interaction.replied) interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
            return;
        }

        const handler = menuHandlers[interaction.customId];
        if (!handler) return;
        const response = handler[value];
        if (!response) return interaction.reply({ content: 'No information available for this option.', flags: 64 });
        return interaction.reply({ content: response, flags: 64 });
    }

    if (interaction.isModalSubmit()) {

        // ── تراكينق ─────────────────────────────────────────────────────────
        if (interaction.customId === 'tracking_modal') {
            try {
                await interaction.deferReply({ flags: 64 });
                const raw = interaction.fields.getTextInputValue('tracking_target').trim();
                const targetId = raw.replace(/[<@!>]/g, '');

                if (!/^\d{17,20}$/.test(targetId)) {
                    return interaction.editReply({ content: '❌ The mention or ID is incorrect.' });
                }
                if (targetId === interaction.user.id) {
                    return interaction.editReply({ content: '❌ You cannot track yourself.' });
                }
                if (trackingSessions.has(targetId)) {
                    return interaction.editReply({ content: '⚠️ This person already has an active tracking session.' });
                }

                const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
                if (!targetMember) {
                    return interaction.editReply({ content: '❌ This person is not in the server.' });
                }

                const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                let code = '';
                for (let i = 0; i < 6; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)];

                let dmSent = true;
                try {
                    await targetMember.send(
                        `⚠️ **Security Alert — You are being tracked!**\n\n` +
                        `A tracking operation has been detected on you from the server **${interaction.guild.name}**.\n\n` +
                        `To cancel the tracking, send this code here within **20 seconds**:\n\n` +
                        `\`\`\`${code}\`\`\``
                    );
                } catch (_) {
                    dmSent = false;
                }

                const timer = setTimeout(async () => {
                    if (!trackingSessions.has(targetId)) return;
                    trackingSessions.delete(targetId);
                    try {
                        const trackerUser = await client.users.fetch(interaction.user.id);
                        const ch = await client.channels.fetch(interaction.channelId).catch(() => null);
                        if (ch) {
                            const doneEmbed = new EmbedBuilder()
                                .setTitle('Tracking Complete')
                                .setColor(0x43A047)
                                .setDescription(
                                    `✅ Successfully tracked ${targetMember} for 20 seconds.\n` +
                                    `👤 Target: **${targetMember.displayName}**\n` +
                                    `🔑 Code: \`${code}\``
                                )
                                .setTimestamp();
                            ch.send({ content: `<@${interaction.user.id}>`, embeds: [doneEmbed] }).catch(() => {});
                        }
                    } catch (_) {}
                }, 20_000);

                trackingSessions.set(targetId, {
                    code,
                    trackerId: interaction.user.id,
                    channelId: interaction.channelId,
                    guildId: interaction.guildId,
                    timer
                });

                const startEmbed = new EmbedBuilder()
                    .setTitle('Tracking Started')
                    .setColor(0xE53935)
                    .setDescription(
                        `🎯 Now tracking ${targetMember} for **20 seconds**\n` +
                        (dmSent
                            ? `📨 The cancellation code has been sent to their DMs`
                            : `⚠️ The bot could not send a DM to the person (DMs are closed)`)
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [startEmbed] });
            } catch (e) {
                console.error('[TRACKING MODAL ERROR]', e);
                if (!interaction.replied) interaction.editReply({ content: '❌ An error occurred.' });
            }
            return;
        }

        // ── Fake ID — CIA ────────────────────────────────────────────────
        if (interaction.customId === 'cia_fake_id_modal') {
            try {
                await interaction.deferReply({ flags: 64 });

                const rawTarget  = interaction.fields.getTextInputValue('fake_target').trim();
                const fakeName   = interaction.fields.getTextInputValue('fake_name').trim();
                const rawDur     = interaction.fields.getTextInputValue('fake_duration').trim().toLowerCase();

                const durMatch = rawDur.match(/^(\d+)(m|h|d)$/);
                if (!durMatch)
                    return interaction.editReply({ content: '❌ Invalid duration format. Example: `30m`, `2h`, or `7d`' });
                const num  = parseInt(durMatch[1]);
                const unit = durMatch[2];
                const msMap = { m: 60_000, h: 3_600_000, d: 86_400_000 };
                const expiresAt = new Date(Date.now() + num * msMap[unit]);

                const targetId = rawTarget.replace(/[<@!>]/g, '');
                if (!/^\d{17,20}$/.test(targetId))
                    return interaction.editReply({ content: '❌ The mention or ID is incorrect.' });

                const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
                if (!targetMember)
                    return interaction.editReply({ content: '❌ This person is not in the server.' });

                // توليد رقم هوية مزيف
                const fakeIban = String(Math.floor(1000000 + Math.random() * 9000000));

                // حفظ الهوية المزيفة
                await db.createFakeIdentity(targetId, interaction.user.id, fakeName, fakeIban, expiresAt);

                const expireTs = Math.floor(expiresAt.getTime() / 1000);

                // إرسال الهوية للشخص عبر DM
                const dmEmbed = new EmbedBuilder()
                    .setTitle('Fake ID — Top Secret')
                    .setColor(0x0D1B2A)
                    .setDescription('You have been provided with a fake ID by the CIA. Do not share this information with anyone.')
                    .addFields(
                        { name: '👤 Fake Name', value: fakeName, inline: true },
                        { name: '🔢 ID Number',  value: `\`${fakeIban}\``, inline: true },
                        { name: '⏳ Expires',    value: `<t:${expireTs}:F> (<t:${expireTs}:R>)`, inline: false }
                    )
                    .setFooter({ text: 'CIA • FANTASY Bot — This information is classified' })
                    .setTimestamp();

                let dmSent = true;
                try { await targetMember.send({ embeds: [dmEmbed] }); }
                catch (_) { dmSent = false; }

                // تأكيد للمصدر
                const confirmEmbed = new EmbedBuilder()
                    .setTitle('Fake ID Issued')
                    .setColor(0x1B5E20)
                    .addFields(
                        { name: '🎯 Target',    value: `<@${targetId}>`, inline: true },
                        { name: '👤 Fake Name', value: fakeName, inline: true },
                        { name: '🔢 ID Number', value: `\`${fakeIban}\``, inline: true },
                        { name: '⏳ Expires',   value: `<t:${expireTs}:R>`, inline: true },
                        { name: '📨 DM',        value: dmSent ? '✅ Sent' : '⚠️ DMs are closed', inline: true }
                    )
                    .setFooter({ text: `Issued by ${interaction.user.tag}` })
                    .setTimestamp();

                await interaction.editReply({ embeds: [confirmEmbed] });
            } catch (e) {
                console.error('[CIA FAKE ID ERROR]', e);
                if (!interaction.replied) interaction.editReply({ content: '❌ An error occurred.' });
            }
            return;
        }

        // ── سوق الأسهم — شراء ───────────────────────────────────────────────
        if (interaction.customId.startsWith('stock_shares_modal:')) {
            try {
                await interaction.deferReply({ flags: 64 });
                const parts   = interaction.customId.split(':');
                const isBuy   = parts[1] === 'buy';
                const companyId = parseInt(parts[2]);

                const loginErr = await db.checkLoginAndIdentity(interaction.user.id);
                if (loginErr) return interaction.editReply({ content: loginErr });

                const activeIdentity = await db.getActiveIdentity(interaction.user.id);

                const sharesInput = interaction.fields.getTextInputValue('stock_shares').trim();
                const shares = parseInt(sharesInput);
                if (isNaN(shares) || shares < 1)
                    return interaction.editReply({ content: '❌ Number of shares must be a whole number greater than 0.' });

                const listings = await db.getAllStockListings();
                const match = listings.find(l => l.company_id === companyId);
                if (!match) return interaction.editReply({ content: '❌ This company is not listed on the market.' });

                const result = isBuy
                    ? await db.buyShares(interaction.user.id, companyId, shares, activeIdentity.slot)
                    : await db.sellShares(interaction.user.id, companyId, shares, activeIdentity.slot);

                if (result.error) return interaction.editReply({ content: `❌ ${result.error}` });

                const changeStr = isBuy
                    ? `🟢 +${result.priceIncrease.toFixed(2)} Riyals`
                    : `🔴 -${result.priceDecrease.toFixed(2)} Riyals`;

                const embed = new EmbedBuilder()
                    .setTitle(isBuy ? '📈 Shares Purchased Successfully' : '📉 Shares Sold Successfully')
                    .setColor(isBuy ? 0x1B5E20 : 0xB71C1C)
                    .addFields(
                        { name: '🏢 Company',       value: match.company_name, inline: true },
                        { name: '📦 Shares',         value: `\`${shares}\``, inline: true },
                        { name: isBuy ? '💸 Amount Paid' : '💰 Amount Earned',
                          value: `\`${(isBuy ? result.totalCost : result.totalEarned).toLocaleString()} Riyals\``, inline: true },
                        { name: '📊 New Price',      value: `\`${parseFloat(result.newPrice).toFixed(2)} Riyals\``, inline: true },
                        { name: '📈 Price Impact',   value: changeStr, inline: true },
                    )
                    .setFooter({ text: 'Stock Market • FANTASY Bot' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
                refreshStockMarket(db).catch(() => {});
            } catch (e) {
                console.error('[STOCK MODAL ERROR]', e);
                if (!interaction.replied) interaction.editReply({ content: '❌ An error occurred.' });
            }
            return;
        }

        // ── بلاغ موقع السرقة ────────────────────────────────────────────────
        if (interaction.customId.startsWith('robbery_report_')) {
            try {
                const parts = interaction.customId.replace('robbery_report_', '').split('_');
                const robberyId = parseInt(parts[0]);
                const amount = parseInt(parts[1]);
                const location = interaction.fields.getTextInputValue('robbery_location').trim();

                const rob = await db.getRobberyById(robberyId);
                const robName = rob?.name || 'Robbery';

                const identity = await db.getActiveIdentity(interaction.user.id);
                const displayName = identity?.character_name || interaction.member?.displayName || interaction.user.username;

                const reportChannelId = await db.getConfig('robbery_report_channel');
                if (reportChannelId) {
                    const ch = await client.channels.fetch(reportChannelId).catch(() => null);
                    if (ch) {
                        const reportEmbed = new EmbedBuilder()
                            .setTitle('Robbery Report')
                            .setColor(0xD32F2F)
                            .addFields(
                                { name: '👤 Suspect',      value: `<@${interaction.user.id}>`, inline: true },
                                { name: '🏷️ Name',         value: displayName, inline: true },
                                { name: '🔫 Robbery Type', value: robName, inline: true },
                                { name: '💵 Amount',        value: `\`${amount.toLocaleString()} Riyals\``, inline: true },
                                { name: '📍 Location',     value: location, inline: false },
                            )
                            .setFooter({ text: 'Robbery Reports • FANTASY Bot' })
                            .setTimestamp();
                        await ch.send({ embeds: [reportEmbed] });
                    }
                }

                const embed = new EmbedBuilder()
                    .setTitle('Robbery Successful!')
                    .setColor(0x2E7D32)
                    .addFields(
                        { name: '🔫 Robbery Type',      value: robName, inline: true },
                        { name: '💵 Amount Stolen',      value: `\`${amount.toLocaleString()} Riyals\``, inline: true },
                        { name: '📍 Reported Location',  value: location, inline: false },
                    )
                    .setFooter({ text: 'Robbery System • FANTASY Bot' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
        }

        // ── إضافة / Deduct Points يدوية ──────────────────────────────────────────────
        if (interaction.customId === 'points_add_modal' || interaction.customId === 'points_deduct_modal') {
            try {
                const isAdd     = interaction.customId === 'points_add_modal';
                const targetId  = interaction.fields.getTextInputValue('target_id').trim();
                const amount    = parseInt(interaction.fields.getTextInputValue('points_amount').trim());

                if (isNaN(amount) || amount <= 0) return interaction.reply({ content: '❌ Enter a positive whole number.', flags: 64 });

                const delta = isAdd ? amount : -amount;
                await db.addStaffManualPoints(targetId, delta);

                const target = await client.users.fetch(targetId).catch(() => null);

                const embed = new EmbedBuilder()
                    .setColor(isAdd ? 0x2E7D32 : 0xB71C1C)
                    .setTitle(isAdd ? '➕ Points Added' : '➖ Points Deducted')
                    .addFields(
                        { name: '👤 Person',    value: target ? `<@${targetId}>` : targetId, inline: true },
                        { name: '📊 Operation', value: `${isAdd ? '+' : '-'}${amount} point(s)`, inline: true },
                        { name: '🔧 By',        value: `<@${interaction.user.id}>`,              inline: true },
                    )
                    .setFooter({ text: 'Admin Points System • FANTASY Bot' }).setTimestamp();

                await interaction.channel.send({ embeds: [embed] });
                return interaction.reply({ content: '​', flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred while modifying points.', flags: 64 });
            }
        }

        // ── تعيين رسالة رحلة مخصصة ────────────────────────────────────────────
        if (interaction.customId.startsWith('set_trip_msg_')) {
            try {
                const type   = interaction.customId.replace('set_trip_msg_', '');
                const text   = interaction.fields.getTextInputValue('trip_msg_text').trim();
                const labels = { trip_start: 'Trip Start', trip_hurricane: 'Hurricane', trip_renewal: 'Renewal' };
                if (text) {
                    await db.setConfig(`${type}_message`, text);
                    await interaction.reply({ content: `✅ Custom **${labels[type]}** message saved.`, flags: 64 });
                } else {
                    await db.setConfig(`${type}_message`, '');
                    await interaction.reply({ content: `🔄 **${labels[type]}** message reset to default.`, flags: 64 });
                }
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
        }

        // ── إضافة زر أولوية (من المودال) ────────────────────────────────────────
        if (interaction.customId.startsWith('priority_add_modal_')) {
            try {
                const style = interaction.customId.replace('priority_add_modal_', '');
                const label = interaction.fields.getTextInputValue('priority_label').trim();
                const text  = interaction.fields.getTextInputValue('priority_text').trim();
                if (!label || !text) return interaction.reply({ content: '❌ All fields must be filled.', flags: 64 });

                const btn = await db.addPriorityButton(label, text, style);
                await interaction.reply({
                    content: `✅ Priority button **${label}** added (ID: ${btn.id})`,
                    flags: 64
                });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
        }

        // ── طلب تفعيل الحساب ──────────────────────────────────────────────────
        if (interaction.customId === 'activation_sony_modal') {
            try {
                const sonyId = interaction.fields.getTextInputValue('sony_id').trim();

                const logChannelId = await db.getConfig('activation_log_channel');
                if (!logChannelId)
                    return interaction.reply({ content: '❌ Activation channel has not been set yet. Contact an Admin.', flags: 64 });

                const logChannel = interaction.guild.channels.cache.get(logChannelId);
                if (!logChannel)
                    return interaction.reply({ content: '❌ Activation channel not found. Contact an Admin.', flags: 64 });

                const req = await db.createActivationRequest(
                    interaction.user.id,
                    interaction.user.username,
                    sonyId
                );

                const reqEmbed = new EmbedBuilder()
                    .setTitle('New Activation Request')
                    .setColor(0x1565C0)
                    .addFields(
                        { name: '👤 Player',       value: `<@${interaction.user.id}> (${interaction.user.username})`, inline: false },
                        { name: '🎮 Sony ID (PSN)', value: `\`${sonyId}\``, inline: true },
                        { name: '🆔 Discord ID',   value: `\`${interaction.user.id}\``, inline: true },
                    )
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setFooter({ text: 'Activation System • FANTASY Bot' }).setTimestamp();

                const approveBtn = new ButtonBuilder()
                    .setCustomId(`activate_approve_${req.id}`)
                    .setLabel('✅ Activate')
                    .setStyle(ButtonStyle.Success);

                const rejectBtn = new ButtonBuilder()
                    .setCustomId(`activate_reject_${req.id}`)
                    .setLabel('❌ Reject')
                    .setStyle(ButtonStyle.Danger);

                await logChannel.send({
                    embeds: [reqEmbed],
                    components: [new ActionRowBuilder().addComponents(approveBtn, rejectBtn)],
                });

                return interaction.reply({
                    content: `✅ **Your activation request has been submitted successfully!**\n> 🎮 **Sony ID:** \`${sonyId}\`\n> Wait for admin approval.`,
                    flags: 64
                });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred while submitting the request.', flags: 64 });
            }
        }

        // ── رفع قضية جديدة ────────────────────────────────────────────────────
        if (interaction.customId === 'new_case_modal') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const identity = await db.getActiveIdentity(interaction.user.id);
                if (!identity) return interaction.reply({ content: 'You are not logged in. Please log in first.', flags: 64 });

                const title      = interaction.fields.getTextInputValue('case_title').trim();
                const defendant  = interaction.fields.getTextInputValue('case_defendant').trim();
                const desc       = interaction.fields.getTextInputValue('case_desc').trim();
                const evidence   = interaction.fields.getTextInputValue('case_evidence')?.trim() || '';
                const lawyerFee  = interaction.fields.getTextInputValue('case_lawyer_fee')?.trim() || '';

                const newCase = await db.createCase(interaction.user.id, identity.full_name || interaction.user.username, defendant, title, desc, evidence, lawyerFee);

                const embed = new EmbedBuilder()
                    .setTitle('Case Filed')
                    .setColor(0x0D47A1)
                    .addFields(
                        { name: '🔢 Case Number', value: newCase.case_number,             inline: true },
                        { name: '📌 Title',        value: title,                           inline: true },
                        { name: '⚔️ Defendant',    value: defendant,                       inline: true },
                        { name: '📝 Description',  value: desc.slice(0, 300),              inline: false },
                        { name: '🔍 Evidence',     value: evidence || 'No evidence',       inline: false },
                        { name: '💰 Lawyer Fee',   value: lawyerFee || 'Not specified',    inline: true },
                        { name: '⏳ Status',        value: '⏳ Pending — awaiting Admin',  inline: true },
                    )
                    .setFooter({ text: 'Law System • FANTASY Bot' })
                    .setTimestamp();

                // إشعار روم القضايا إن وُجد
                const casesChannelId = await db.getConfig('cases_channel');
                if (casesChannelId) {
                    const ch = interaction.guild?.channels?.cache?.get(casesChannelId);
                    if (ch) ch.send({ embeds: [embed] }).catch(() => {});
                }

                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred while filing the case.', flags: 64 }); }
        }

        // ── تأكيد التخلي عن القضية ────────────────────────────────────────────
        if (interaction.customId.startsWith('lawyer_abandon_modal_')) {
            try {
                const caseId = Number(interaction.customId.replace('lawyer_abandon_modal_', ''));
                const reason = interaction.fields.getTextInputValue('abandon_reason').trim();
                const c = await db.getCaseById(caseId);
                if (!c) return interaction.reply({ content: '❌ Case not found.', flags: 64 });
                if (c.lawyer_id !== interaction.user.id)
                    return interaction.reply({ content: '❌ You are not the lawyer for this case.', flags: 64 });

                const { ABANDON_FEE } = require('./commands/lawyer-tasks');
                const result = await db.abandonCase(caseId, interaction.user.id, c.plaintiff_id, ABANDON_FEE);

                if (!result.success)
                    return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });

                // إشعار الموكّل بالخاص
                try {
                    const plaintiffUser = await interaction.client.users.fetch(c.plaintiff_id);
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('Lawyer Withdrew from Your Case')
                        .setColor(0xB71C1C)
                        .setDescription(`Lawyer **${c.lawyer_name}** has withdrawn from representing you in the case.`)
                        .addFields(
                            { name: '🔢 Case Number',  value: c.case_number, inline: true },
                            { name: '📌 Title',         value: c.title,       inline: true },
                            { name: '📝 Reason',        value: reason,        inline: false },
                            { name: '💰 Compensation',
                              value: `✅ **${ABANDON_FEE.toLocaleString()} Riyals** have been returned to your balance`,
                              inline: false },
                        )
                        .setFooter({ text: 'Law System • FANTASY Bot' }).setTimestamp();
                    await plaintiffUser.send({ embeds: [dmEmbed] });
                } catch (_) {}

                await interaction.reply({ content: `✅ Withdrawn from case **${c.case_number}** and **${ABANDON_FEE.toLocaleString()} Riyals** have been deducted from your balance as compensation for the client.`, flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        // ── رفض قضية ─────────────────────────────────────────────────────────
        if (interaction.customId.startsWith('case_reject_modal_')) {
            try {
                const caseId = Number(interaction.customId.replace('case_reject_modal_', ''));
                const reason = interaction.fields.getTextInputValue('reason').trim();
                const c      = await db.getCaseById(caseId);
                if (!c) return interaction.reply({ content: '❌ Case not found.', flags: 64 });

                await db.rejectCase(caseId, reason, interaction.user.id);

                const embed = new EmbedBuilder()
                    .setTitle('Case Rejected')
                    .setColor(0xB71C1C)
                    .addFields(
                        { name: '🔢 Case Number',      value: c.case_number,           inline: true },
                        { name: '📌 Title',             value: c.title,                 inline: true },
                        { name: '👤 Plaintiff',         value: `<@${c.plaintiff_id}>`,  inline: true },
                        { name: '❌ Reason for Rejection', value: reason,               inline: false },
                    )
                    .setFooter({ text: `Rejected by: ${interaction.user.username} • FANTASY Bot` })
                    .setTimestamp();

                // DM the plaintiff about rejection
                try {
                    const plaintiff = await interaction.client.users.fetch(c.plaintiff_id);
                    const dmEmbed = new EmbedBuilder().setTitle('Your Case Has Been Rejected').setColor(0xB71C1C)
                        .addFields(
                            { name: '🔢 Case Number',      value: c.case_number, inline: true },
                            { name: '📌 Title',             value: c.title,       inline: true },
                            { name: '❌ Reason',            value: reason,         inline: false },
                        ).setFooter({ text: 'Law System • FANTASY Bot' }).setTimestamp();
                    await plaintiff.send({ embeds: [dmEmbed] });
                } catch (_) {}
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        // ── توكيل قاضي ───────────────────────────────────────────────────────
        if (interaction.customId.startsWith('case_judge_modal_')) {
            try {
                const caseId    = Number(interaction.customId.replace('case_judge_modal_', ''));
                const judgeText = interaction.fields.getTextInputValue('judge_mention').trim();
                const c         = await db.getCaseById(caseId);
                if (!c) return interaction.reply({ content: '❌ Case not found.', flags: 64 });

                const mentionMatch = judgeText.match(/^<@!?(\d+)>$/);
                const judgeId   = mentionMatch ? mentionMatch[1] : null;
                const judgeName = judgeText;

                await db.assignJudge(caseId, judgeId, judgeName);

                const embed = new EmbedBuilder()
                    .setTitle('Judge Assigned')
                    .setColor(0x4A148C)
                    .addFields(
                        { name: '🔢 Case Number', value: c.case_number,                                inline: true },
                        { name: '📌 Title',        value: c.title,                                     inline: true },
                        { name: '👤 Plaintiff',    value: `<@${c.plaintiff_id}>`,                      inline: true },
                        { name: '👨‍⚖️ Judge',     value: judgeId ? `<@${judgeId}>` : judgeName,       inline: true },
                        { name: '⚖️ Status',       value: '⚖️ In Progress',                           inline: true },
                    )
                    .setFooter({ text: `Assigned by: ${interaction.user.username} • FANTASY Bot` })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        // ── إصدار حكم ────────────────────────────────────────────────────────
        if (interaction.customId.startsWith('case_verdict_modal_')) {
            try {
                const caseId  = Number(interaction.customId.replace('case_verdict_modal_', ''));
                const verdict = interaction.fields.getTextInputValue('verdict').trim();
                const c       = await db.getCaseById(caseId);
                if (!c) return interaction.reply({ content: '❌ Case not found.', flags: 64 });

                await db.issueVerdict(caseId, verdict, interaction.user.id);

                const embed = new EmbedBuilder()
                    .setTitle('Verdict Issued')
                    .setColor(0x1B5E20)
                    .addFields(
                        { name: '🔢 Case Number', value: c.case_number,                   inline: true },
                        { name: '📌 Title',        value: c.title,                         inline: true },
                        { name: '👤 Plaintiff',    value: `<@${c.plaintiff_id}>`,           inline: true },
                        { name: '⚔️ Defendant',    value: c.defendant,                     inline: true },
                        { name: '👨‍⚖️ Judge',     value: c.judge_name || 'Not specified', inline: true },
                        { name: '📜 Verdict',      value: verdict,                         inline: false },
                        { name: '🔒 Status',       value: '🔒 Closed',                    inline: true },
                    )
                    .setFooter({ text: `Issued by: ${interaction.user.username} • FANTASY Bot` })
                    .setTimestamp();

                // DM the plaintiff with the verdict
                try {
                    const plaintiff = await interaction.client.users.fetch(c.plaintiff_id);
                    const dmEmbed = new EmbedBuilder().setTitle('A Verdict Has Been Issued in Your Case').setColor(0x1B5E20)
                        .addFields(
                            { name: '🔢 Case Number', value: c.case_number,                   inline: true },
                            { name: '📌 Title',        value: c.title,                         inline: true },
                            { name: '👨‍⚖️ Judge',     value: c.judge_name || 'Not specified', inline: true },
                            { name: '📜 Verdict',      value: verdict,                         inline: false },
                        ).setFooter({ text: 'Justice System • FANTASY Bot' }).setTimestamp();
                    await plaintiff.send({ embeds: [dmEmbed] });
                } catch (_) {}

                const verdictsChannelId = await db.getConfig('verdicts_channel');
                if (verdictsChannelId) {
                    const ch = interaction.guild?.channels?.cache?.get(verdictsChannelId);
                    if (ch) ch.send({ embeds: [embed] }).catch(() => {});
                }

                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        // ── توكيل محامي (طلب) ────────────────────────────────────────────────
        if (interaction.customId.startsWith('case_lawyer_modal_')) {
            try {
                const caseId     = Number(interaction.customId.replace('case_lawyer_modal_', ''));
                const lawyerName = interaction.fields.getTextInputValue('lawyer_name').trim();
                const reason     = interaction.fields.getTextInputValue('lawyer_reason').trim();
                const c          = await db.getCaseById(caseId);
                if (!c) return interaction.reply({ content: '❌ Case not found.', flags: 64 });

                await db.assignLawyer(caseId, null, lawyerName);

                const embed = new EmbedBuilder()
                    .setTitle('Lawyer Power of Attorney Request')
                    .setColor(0xE65100)
                    .addFields(
                        { name: '🔢 Case Number',           value: c.case_number,          inline: true },
                        { name: '📌 Title',                  value: c.title,                inline: true },
                        { name: '👤 Plaintiff',              value: `<@${c.plaintiff_id}>`, inline: true },
                        { name: '👨‍⚖️ Requested Lawyer',   value: lawyerName,             inline: true },
                        { name: '📝 Reason',                 value: reason,                 inline: false },
                    )
                    .setFooter({ text: 'Law System • FANTASY Bot' })
                    .setTimestamp();

                const casesChannelId = await db.getConfig('cases_channel');
                if (casesChannelId) {
                    const ch = interaction.guild?.channels?.cache?.get(casesChannelId);
                    if (ch) ch.send({ embeds: [embed] }).catch(() => {});
                }

                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) { console.error(e); return interaction.reply({ content: '❌ An error occurred.', flags: 64 }); }
        }

        if (interaction.customId === 'report_police_modal' || interaction.customId === 'report_ambulance_modal') {
            try {
                const isPolice   = interaction.customId === 'report_police_modal';
                const location   = interaction.fields.getTextInputValue('report_location').trim();
                const details    = interaction.fields.getTextInputValue('report_details').trim();
                const configKey  = isPolice ? 'police_reports_channel' : 'ambulance_reports_channel';
                const channelId  = await db.getConfig(configKey);
                if (!channelId) return interaction.reply({ content: `❌ Reports channel has not been set. Contact an Admin.`, flags: 64 });

                const identity = await db.getActiveIdentity(interaction.user.id);
                const charName = identity ? (identity.character_name || interaction.user.username) : interaction.user.username;

                const embed = new EmbedBuilder()
                    .setTitle(isPolice ? '🚨 Police Report' : '🚑 Ambulance Report')
                    .setColor(isPolice ? 0xB71C1C : 0x1565C0)
                    .addFields(
                        { name: '👤 Reporter',       value: `<@${interaction.user.id}> — \`${charName}\``, inline: false },
                        { name: '📍 Location',        value: location,  inline: true },
                        { name: '📋 Report Details',  value: details,   inline: false },
                    )
                    .setFooter({ text: `Reports System • FANTASY Bot` })
                    .setTimestamp();

                try {
                    const ch = await client.channels.fetch(channelId);
                    if (ch) await ch.send({ embeds: [embed] });
                } catch {}

                return interaction.reply({ content: `✅ ${isPolice ? 'Police report' : 'Ambulance report'} submitted successfully.`, flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId === 'bank_deposit_modal') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const loginErr = await db.checkLoginAndIdentity(interaction.user.id);
                if (loginErr) return interaction.reply({ content: loginErr, flags: 64 });
                const amount = parseInt(interaction.fields.getTextInputValue('deposit_amount').replace(/,/g, ''));
                if (isNaN(amount) || amount <= 0)
                    return interaction.reply({ content: '❌ Invalid amount.', flags: 64 });
                const result = await db.depositCash(interaction.user.id, amount);
                if (!result.success) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });
                const embed = new EmbedBuilder()
                    .setTitle('Cash Deposited to Bank')
                    .setColor(0x2E7D32)
                    .addFields(
                        { name: '💵 Cash Deposited', value: `\`${amount.toLocaleString()} Riyals\``, inline: true },
                        { name: '🏦 New Bank Balance', value: `\`${(Number(result.sender.balance) + amount).toLocaleString()} Riyals\``, inline: true },
                        { name: '💵 Remaining Cash',  value: `\`${(Number(result.sender.cash) - amount).toLocaleString()} Riyals\``, inline: true },
                    )
                    .setFooter({ text: 'Bank System • FANTASY Bot' }).setTimestamp();
                return interaction.reply({ embeds: [embed] , flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId === 'bank_withdraw_modal') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const loginErr = await db.checkLoginAndIdentity(interaction.user.id);
                if (loginErr) return interaction.reply({ content: loginErr, flags: 64 });
                const amount = parseInt(interaction.fields.getTextInputValue('withdraw_amount').replace(/,/g, ''));
                if (isNaN(amount) || amount <= 0)
                    return interaction.reply({ content: '❌ Invalid amount.', flags: 64 });
                const result = await db.withdrawCash(interaction.user.id, amount);
                if (!result.success) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });
                const embed = new EmbedBuilder()
                    .setTitle('Cash Withdrawn from Bank')
                    .setColor(0xB71C1C)
                    .addFields(
                        { name: '💵 Cash Withdrawn',  value: `\`${amount.toLocaleString()} Riyals\``, inline: true },
                        { name: '🏦 New Bank Balance', value: `\`${(Number(result.sender.balance) - amount).toLocaleString()} Riyals\``, inline: true },
                        { name: '💵 New Cash',         value: `\`${(Number(result.sender.cash) + amount).toLocaleString()} Riyals\``, inline: true },
                    )
                    .setFooter({ text: 'Bank System • FANTASY Bot' }).setTimestamp();
                return interaction.reply({ embeds: [embed] , flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
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
                    return interaction.reply({ content: '❌ Invalid amount. Enter a positive number.', flags: 64 });

                const result = await db.transferMoney(interaction.user.id, toIban, amount, note);
                if (!result.success)
                    return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });

                const SLOT_NAMES = { 1: 'Character 1', 2: 'Character 2', 3: 'Character 3' };
                const embed = new EmbedBuilder()
                    .setTitle('Transfer Successful')
                    .setColor(0x1565C0)
                    .addFields(
                        { name: '👤 Sender',               value: `${result.sender.character_name} ${result.sender.family_name || ''} (${SLOT_NAMES[result.sender.slot] || `Character ${result.sender.slot}`})`, inline: false },
                        { name: '🏦 Your IBAN',            value: `\`${result.sender.iban}\``, inline: true },
                        { name: '💰 Balance After Transfer', value: `\`${(Number(result.sender.balance) - amount).toLocaleString()} Riyals\``, inline: true },
                        { name: '\u200b',                   value: '\u200b', inline: true },
                        { name: '📨 Recipient',             value: `${result.receiver.character_name} ${result.receiver.family_name || ''}`, inline: true },
                        { name: '🏦 Recipient IBAN',        value: `\`${toIban}\``, inline: true },
                        { name: '💸 Amount Transferred',    value: `\`${amount.toLocaleString()} Riyals\``, inline: true },
                        { name: '📝 Note',                  value: note || '—', inline: false },
                    )
                    .setFooter({ text: 'Bank System • FANTASY Bot' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed] , flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred during the transfer.', flags: 64 });
            }
        }

        if (interaction.customId === 'x_create_modal') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const xUsername = interaction.fields.getTextInputValue('x_username').trim().replace(/\s+/g, '_');
                const result = await db.createXAccount(interaction.user.id, xUsername);
                if (!result.success) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });
                const embed = new EmbedBuilder()
                    .setTitle('X Account Created')
                    .setColor(0x000000)
                    .addFields({ name: '👤 Account Name', value: `**@${xUsername}**`, inline: true })
                    .setFooter({ text: 'X Platform • FANTASY Bot' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred while creating the account.', flags: 64 });
            }
        }

        if (interaction.customId === 'snap_create_modal') {
            try {
                const snapUsername = interaction.fields.getTextInputValue('snap_user').trim();
                if (!/^[\w\u0600-\u06FF]{3,20}$/.test(snapUsername))
                    return interaction.reply({ content: '❌ Account name must be 3-20 characters with no spaces.', flags: 64 });
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const result = await db.createSnapAccount(interaction.user.id, snapUsername);
                if (!result.success) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });
                const { buildSnap } = require('./commands/snap');
                const account = await db.getSnapAccount(interaction.user.id);
                const img = await db.getImage('Snapchat');
                return interaction.reply(await buildSnap(account, img, db));
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId === 'snap_add_modal') {
            try {
                const friendName = interaction.fields.getTextInputValue('friend_snap_name').trim();
                const myAcc = await db.getSnapAccount(interaction.user.id);
                if (!myAcc) return interaction.reply({ content: '❌ You do not have a Snap account.', flags: 64 });
                const friendAcc = await db.getSnapAccountByUsername(friendName);
                if (!friendAcc) return interaction.reply({ content: `❌ No account found with the name **${friendName}**.`, flags: 64 });
                if (friendAcc.discord_id === interaction.user.id) return interaction.reply({ content: '❌ You cannot add yourself.', flags: 64 });
                const result = await db.addSnapFriend(interaction.user.id, friendAcc.discord_id);
                if (!result.success) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });
                // notify via DM
                try {
                    const targetUser = await client.users.fetch(friendAcc.discord_id);
                    const notif = new EmbedBuilder()
                        .setTitle('New Snap Friend Request!')
                        .setColor(0xFFFC00)
                        .setDescription(`**@${myAcc.snap_username}** wants to add you as a friend on Snapchat!\nUse the **Requests button 🔔** to accept the request.`)
                        .setFooter({ text: 'Snapchat • FANTASY Bot' })
                        .setTimestamp();
                    await targetUser.send({ embeds: [notif] });
                } catch (_) {}
                const embed = new EmbedBuilder()
                    .setTitle('Friend Request Sent')
                    .setColor(0xFFFC00)
                    .setDescription(`Friend request sent to **@${friendAcc.snap_username}** 👻\nThey will be notified and need to accept.`)
                    .setFooter({ text: 'Snapchat • FANTASY Bot' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
        }

        if (interaction.customId.startsWith('snap_send_modal_')) {
            try {
                const receiverId = interaction.customId.replace('snap_send_modal_', '');
                const content = interaction.fields.getTextInputValue('snap_content').trim();
                const myAcc = await db.getSnapAccount(interaction.user.id);
                const receiverAcc = await db.getSnapAccount(receiverId);
                if (!myAcc || !receiverAcc) return interaction.reply({ content: '❌ Account not found.', flags: 64 });
                await db.sendSnap(interaction.user.id, receiverId, content);
                // DM notification
                try {
                    const targetUser = await client.users.fetch(receiverId);
                    const notif = new EmbedBuilder()
                        .setTitle('New Snap Received!')
                        .setColor(0xFFFC00)
                        .setDescription(`**@${myAcc.snap_username}** sent you a snap!\nOpen Snapchat to view it 👻`)
                        .setFooter({ text: 'Snapchat • FANTASY Bot' })
                        .setTimestamp();
                    await targetUser.send({ embeds: [notif] });
                } catch (_) {}
                const embed = new EmbedBuilder()
                    .setTitle('Snap Sent!')
                    .setColor(0xFFFC00)
                    .setDescription(`Snap sent to **@${receiverAcc.snap_username}** successfully 👻`)
                    .setFooter({ text: 'Snapchat • FANTASY Bot' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed] , flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred while sending the snap.', flags: 64 });
            }
        }

        if (interaction.customId === 'x_tweet_modal') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const content = interaction.fields.getTextInputValue('tweet_content').trim();
                const account = await db.getXAccount(interaction.user.id);
                if (!account) return interaction.reply({ content: '❌ You do not have an X Platform account.', flags: 64 });
                const xChannelId = await db.getConfig('x_channel');
                if (!xChannelId) return interaction.reply({ content: '❌ The tweets channel has not been set. Contact the admins.', flags: 64 });
                const post = await db.postTweet(interaction.user.id, content);
                const { buildTweetMessage } = require('./commands/tweet');
                const { embed: tweetEmbed, row: tweetRow } = buildTweetMessage(post, interaction.user.displayAvatarURL());
                const xChannel = interaction.guild?.channels?.cache.get(xChannelId);
                if (xChannel) await xChannel.send({ embeds: [tweetEmbed], components: [tweetRow] });
                return interaction.reply({ content: `✅ Your tweet has been posted in <#${xChannelId}>`, flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred while posting the tweet.', flags: 64 });
            }
        }

        if (interaction.customId.startsWith('x_reply_modal_')) {
            try {
                const postId = parseInt(interaction.customId.replace('x_reply_modal_', ''));
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const content = interaction.fields.getTextInputValue('reply_content').trim();
                const myAcc = await db.getXAccount(interaction.user.id);
                if (!myAcc) return interaction.reply({ content: '❌ You do not have an X Platform account.', flags: 64 });
                const xChannelId = await db.getConfig('x_channel');
                if (!xChannelId) return interaction.reply({ content: '❌ The tweets channel has not been set.', flags: 64 });
                const orig = await db.getPostById(postId);
                if (!orig) return interaction.reply({ content: '❌ Original tweet not found.', flags: 64 });
                const reply = await db.replyPost(interaction.user.id, postId, content);
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `@${myAcc.x_username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setColor(0x17BF63)
                    .setDescription(content)
                    .addFields(
                        { name: '↩️ In reply to', value: `@${orig.x_username} • #${postId}`, inline: true },
                        { name: '🆔 Reply ID',    value: `\`#${reply.id}\``, inline: true },
                    )
                    .setFooter({ text: 'X Platform • FANTASY Bot' })
                    .setTimestamp();
                const xChannel = interaction.guild?.channels?.cache.get(xChannelId);
                if (xChannel) await xChannel.send({ embeds: [embed] });
                return interaction.reply({ content: `✅ Your reply has been posted in <#${xChannelId}>`, flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred while posting the reply.', flags: 64 });
            }
        }

        if (interaction.customId === 'bag_transfer_modal') {
            try {
                await db.ensureUser(interaction.user.id, interaction.user.username);
                const itemName = interaction.fields.getTextInputValue('transfer_item_name').trim();
                const toIban   = interaction.fields.getTextInputValue('transfer_iban').trim();
                const receiver = await db.getIdentityByIban(toIban);
                if (!receiver) return interaction.reply({ content: '❌ No user found with this IBAN.', flags: 64 });
                if (receiver.discord_id === interaction.user.id) return interaction.reply({ content: '❌ You cannot transfer an item to yourself.', flags: 64 });
                const result = await db.transferItem(interaction.user.id, receiver.discord_id, itemName);
                if (!result || result.success === false) return interaction.reply({ content: `❌ ${result?.error || 'Item not found in your bag or quantity is zero.'}`, flags: 64 });
                const embed = new EmbedBuilder()
                    .setTitle('Item Transferred Successfully')
                    .setColor(0x6A1B9A)
                    .addFields(
                        { name: '🎒 Item',           value: `**${itemName}**`, inline: true },
                        { name: '📨 Recipient',       value: `${receiver.character_name} ${receiver.family_name || ''}`, inline: true },
                        { name: '🏦 Recipient IBAN',  value: `\`${toIban}\``, inline: true },
                    )
                    .setFooter({ text: 'Bag System • FANTASY Bot' })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred during the transfer.', flags: 64 });
            }
        }

        if (interaction.customId === 'trip_start_modal') {
            try {
                await interaction.deferReply({ flags: 64 });
            } catch (e) {
                return;
            }
            try {
                const startChannelId = await db.getConfig('trips_start_channel');
                if (!startChannelId) return interaction.editReply({ content: '❌ Trip start channel has not been set. Use `/إعداد-رحلات` first.' });

                const hostId     = interaction.fields.getTextInputValue('trip_host_id').trim()   || '—';
                const deputy     = interaction.fields.getTextInputValue('trip_deputy').trim()     || '—';
                const supervisor = interaction.fields.getTextInputValue('trip_supervisor').trim() || '—';
                const tripTime   = interaction.fields.getTextInputValue('trip_time').trim()       || '—';
                console.log(`[trip_start] host="${hostId}" deputy="${deputy}" supervisor="${supervisor}" time="${tripTime}"`);

                await db.setConfig('trip_open', 'true');
                await db.setConfig('hurricane_active', 'false');

                const customMsg = await db.getConfig('trip_start_message');
                let sent = false;
                try {
                    const ch = await client.channels.fetch(startChannelId);
                    if (ch) {
                        if (customMsg) {
                            const filled = customMsg
                                .replace(/\{هوست\}/g,   hostId)
                                .replace(/\{نائب\}/g,   deputy)
                                .replace(/\{رقابي\}/g,  supervisor)
                                .replace(/\{وقت\}/g,    tripTime)
                                .replace(/\{منظم\}/g,   `<@${interaction.user.id}>`);
                            const embed = new EmbedBuilder()
                                .setTitle('Start New Trip!')
                                .setColor(0x2E7D32)
                                .setDescription(filled)
                                .setFooter({ text: 'Trip System • FANTASY Bot' })
                                .setTimestamp();
                            await ch.send({ embeds: [embed] });
                            sendToCharLog(embed);
                            sendToTripLog(embed);
                        } else {
                            const embed = new EmbedBuilder()
                                .setTitle('Start New Trip!')
                                .setColor(0x2E7D32)
                                .setDescription('🎉 **A new trip has been opened! All players can now log in.**')
                                .addFields(
                                    { name: '🎤 Host',        value: `\`${hostId}\``, inline: true },
                                    { name: '🎤 Deputy Host', value: deputy,           inline: true },
                                    { name: '👁️ Supervisor',  value: supervisor,       inline: true },
                                    { name: '🕐 Trip Time',   value: tripTime,          inline: true },
                                    { name: '🔧 Started by',  value: `<@${interaction.user.id}>`, inline: true },
                                )
                                .setFooter({ text: 'Trip System • FANTASY Bot' })
                                .setTimestamp();
                            await ch.send({ embeds: [embed] });
                            sendToCharLog(embed);
                            sendToTripLog(embed);
                        }
                        sent = true;
                    }
                } catch (sendErr) {
                    console.error('[trip_start] channel send error:', sendErr?.message);
                }
                await db.addStaffActivity(interaction.user.id, 'trips_count');
                return interaction.editReply({ content: sent ? '✅ Trip start notification sent.' : '⚠️ Trip opened but message could not be sent — check the bot\'s permissions in the channel.' });
            } catch (e) {
                console.error('[trip_start_modal] error:', e?.message, e);
                return interaction.editReply({ content: '❌ An error occurred: ' + (e?.message || e) });
            }
        }

        if (interaction.customId === 'trip_renewal_modal') {
            try {
                await interaction.deferReply({ flags: 64 });
            } catch (e) {
                return;
            }
            try {
                const alertsChannelId = await db.getConfig('trips_alerts_channel');
                if (!alertsChannelId) return interaction.editReply({ content: '❌ Alerts channel has not been set. Use `/إعداد-رحلات` first.' });

                const hostId = interaction.fields.getTextInputValue('renewal_host_id').trim() || '—';

                const customMsg = await db.getConfig('trip_renewal_message');
                let sent = false;
                try {
                    const ch = await client.channels.fetch(alertsChannelId);
                    if (ch) {
                        if (customMsg) {
                            const filled = customMsg
                                .replace(/\{هوست\}/g,  hostId)
                                .replace(/\{منظم\}/g,  `<@${interaction.user.id}>`);
                            const embed = new EmbedBuilder()
                                .setTitle('Trip Renewal')
                                .setColor(0x1565C0)
                                .setDescription(filled)
                                .setFooter({ text: 'Trip System • FANTASY Bot' })
                                .setTimestamp();
                            await ch.send({ embeds: [embed] });
                            sendToTripLog(embed);
                        } else {
                            const embed = new EmbedBuilder()
                                .setTitle('Trip Renewal')
                                .setColor(0x1565C0)
                                .setDescription('🔄 **Trip has been renewed!**')
                                .addFields(
                                    { name: '🎤 Host ID',    value: `\`${hostId}\``, inline: true },
                                    { name: '🔧 Renewed by', value: `<@${interaction.user.id}>`, inline: true },
                                )
                                .setFooter({ text: 'Trip System • FANTASY Bot' })
                                .setTimestamp();
                            await ch.send({ embeds: [embed] });
                            sendToTripLog(embed);
                        }
                        sent = true;
                    }
                } catch (sendErr) {
                    console.error('[trip_renewal] channel send error:', sendErr?.message);
                }
                return interaction.editReply({ content: sent ? '✅ Renewal notification sent.' : '⚠️ Renewal recorded but message could not be sent — check the bot\'s permissions in the channel.' });
            } catch (e) {
                console.error('[trip_renewal_modal] error:', e?.message, e);
                return interaction.editReply({ content: '❌ An error occurred: ' + (e?.message || e) });
            }
        }

        if (interaction.customId === 'trip_alert_modal') {
            try {
                const alertsChannelId = await db.getConfig('trips_alerts_channel');
                if (!alertsChannelId) return interaction.reply({ content: '❌ Alerts channel has not been set. Use `/إعداد-رحلات` first.', flags: 64 });

                const alertText = interaction.fields.getTextInputValue('alert_text').trim();

                const embed = new EmbedBuilder()
                    .setTitle('Alert')
                    .setColor(0xF57F17)
                    .setDescription(alertText)
                    .addFields({ name: '🔧 Sent by', value: `<@${interaction.user.id}>`, inline: true })
                    .setFooter({ text: 'Trip System • FANTASY Bot' })
                    .setTimestamp();

                try {
                    const ch = await client.channels.fetch(alertsChannelId);
                    if (ch) await ch.send({ embeds: [embed] });
                } catch {}
                sendToTripLog(embed);
                return interaction.reply({ content: '✅ Alert sent.', flags: 64 });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
        }

        // ── موقع البانيك ─────────────────────────────────────────────────────
        if (interaction.customId === 'panic_location_modal') {
            try {
                const location = interaction.fields.getTextInputValue('panic_location_text').trim();
                const identity = await db.getActiveIdentity(interaction.user.id);
                const displayName = identity?.character_name || interaction.member?.displayName || interaction.user.username;

                const panicChannelId = await db.getConfig('panic_channel');
                if (!panicChannelId)
                    return interaction.reply({ content: '❌ Panic channel has not been set up. Contact an Admin.', flags: 64 });

                const ch = await client.channels.fetch(panicChannelId).catch(() => null);
                if (!ch)
                    return interaction.reply({ content: '❌ Channel not found or the bot does not have access to it.', flags: 64 });

                const embed = new EmbedBuilder()
                    .setTitle('Panic — Distress Call')
                    .setColor(0xD32F2F)
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .addFields(
                        { name: '👤 Caller',   value: `<@${interaction.user.id}>`, inline: true },
                        { name: '🏷️ Name',    value: displayName, inline: true },
                        { name: '📍 Location', value: location, inline: false },
                    )
                    .setFooter({ text: 'Panic System • FANTASY Bot' })
                    .setTimestamp();

                await ch.send({ content: '@here', embeds: [embed] });
                return interaction.reply({ content: '✅ Your location has been sent, help is on the way!', flags: 64 });
            } catch (e) {
                console.error('[PANIC ERROR]', e);
                return interaction.reply({ content: '❌ An error occurred while sending the location.', flags: 64 });
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
                if (slotTaken) return interaction.reply({ content: '❌ This slot is already occupied. Choose another slot.', flags: 64 });

                const pending = await db.createPendingIdentity({
                    discordId: interaction.user.id,
                    username: interaction.user.username,
                    slot, charName, familyName, birthPlace, birthDate, gender
                });
                await db.addCharacterLog(interaction.user.id, interaction.user.username, 'pending', charName, slot);

                const pendingSlotNames = { 1: 'Character 1', 2: 'Character 2', 3: 'Character 3' };
                const logChannelId = await db.getConfig('identity_log_channel');
                if (logChannelId) {
                    try {
                        const logChannel = await client.channels.fetch(logChannelId);
                        if (logChannel) {
                            const logEmbed = new EmbedBuilder()
                                .setTitle('New Identity Request — Pending Review')
                                .setColor(0xF57F17)
                                .setThumbnail(interaction.user.displayAvatarURL())
                                .addFields(
                                    { name: '👤 User',           value: `<@${interaction.user.id}> — \`${interaction.user.username}\``, inline: false },
                                    { name: '📌 Slot',           value: pendingSlotNames[slot], inline: true },
                                    { name: '👤 First Name',     value: charName, inline: true },
                                    { name: '👥 Family Name',    value: familyName, inline: true },
                                    { name: '⚧ Gender',          value: gender, inline: true },
                                    { name: '📅 Date of Birth',  value: birthDate, inline: true },
                                    { name: '📍 Place of Birth', value: birthPlace, inline: true },
                                    { name: '🆔 Request #',      value: `\`#${pending.id}\``, inline: true },
                                )
                                .setFooter({ text: 'Identity System • FANTASY Bot' })
                                .setTimestamp();
                            const btnRow = new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setCustomId(`approve_identity_${pending.id}`).setLabel('✅ Approve').setStyle(ButtonStyle.Success),
                                new ButtonBuilder().setCustomId(`reject_identity_${pending.id}`).setLabel('❌ Reject').setStyle(ButtonStyle.Danger)
                            );
                            await logChannel.send({ embeds: [logEmbed], components: [btnRow] });
                        }
                    } catch (e) { console.error('log channel error:', e); }
                }

                const pendingNamesLog = { 1: 'Character 1', 2: 'Character 2', 3: 'Character 3' };
                const pendingLogEmbed = new EmbedBuilder()
                    .setTitle('⏳ New Identity Request')
                    .setColor(0xF57F17)
                    .addFields(
                        { name: '👤 User',       value: `<@${interaction.user.id}>`, inline: true },
                        { name: '📌 Slot',       value: pendingNamesLog[slot], inline: true },
                        { name: '🪪 Name',       value: `${charName} ${familyName}`, inline: true },
                        { name: '🆔 Request #',  value: `\`#${pending.id}\``, inline: true },
                    )
                    .setFooter({ text: 'Identity System • FANTASY Bot' })
                    .setTimestamp();
                sendToCharLog(pendingLogEmbed);

                return interaction.reply({
                    content: `⏳ **Your identity request \`#${pending.id}\` has been submitted for review.**\nYou will receive a response when it is approved or rejected.`,
                    flags: 64
                });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: '❌ An error occurred while submitting the request.', flags: 64 });
            }
        }

        if (interaction.customId === 'comp_deposit_modal' || interaction.customId === 'comp_withdraw_modal') {
            try {
                const isDeposit = interaction.customId === 'comp_deposit_modal';
                const amountStr = interaction.fields.getTextInputValue('amount').trim();
                const amount = parseInt(amountStr);
                if (isNaN(amount) || amount <= 0)
                    return interaction.reply({ content: '❌ Invalid amount. Enter a whole number.', flags: 64 });

                const identity = await db.getActiveIdentity(interaction.user.id);
                if (!identity)
                    return interaction.reply({ content: 'You are not logged in. Please log in first.', flags: 64 });

                const company = await db.getUserCompany(interaction.user.id);
                if (!company)
                    return interaction.reply({ content: '❌ You are not linked to any company.', flags: 64 });

                if (isDeposit) {
                    const result = await db.depositToCompany(company.id, interaction.user.id, identity.slot, amount);
                    if (result.error) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });
                    const updated = await db.getCompanyById(company.id);
                    const embed = new EmbedBuilder()
                        .setTitle('Deposited to Company Account')
                        .setColor(0x1B5E20)
                        .addFields(
                            { name: '🏢 Company',         value: company.name, inline: true },
                            { name: '💵 Amount',           value: `\`${amount.toLocaleString()} Riyals\``, inline: true },
                            { name: '💰 Company Balance',  value: `\`${(updated?.balance || 0).toLocaleString()} Riyals\``, inline: true },
                        ).setFooter({ text: 'Company System • FANTASY Bot' }).setTimestamp();
                    return interaction.reply({ embeds: [embed], flags: 64 });
                } else {
                    if (company.userRole !== 'مالك' && company.userRole !== 'مدير')
                        return interaction.reply({ content: '❌ Only the owner and manager can withdraw funds.', flags: 64 });
                    const result = await db.withdrawFromCompany(company.id, interaction.user.id, identity.slot, amount);
                    if (result.error) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });
                    const updated = await db.getCompanyById(company.id);
                    const embed = new EmbedBuilder()
                        .setTitle('Withdrawn from Company Account')
                        .setColor(0xF57F17)
                        .addFields(
                            { name: '🏢 Company',        value: company.name, inline: true },
                            { name: '💵 Amount',          value: `\`${amount.toLocaleString()} Riyals\``, inline: true },
                            { name: '💰 Company Balance', value: `\`${(updated?.balance || 0).toLocaleString()} Riyals\``, inline: true },
                        ).setFooter({ text: 'Company System • FANTASY Bot' }).setTimestamp();
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }
            } catch (e) {
                console.error('[COMP DEPOSIT/WITHDRAW ERROR]', e);
                if (!interaction.replied) interaction.reply({ content: '❌ An error occurred.', flags: 64 });
            }
            return;
        }

        if (interaction.customId === 'comp_hire_modal') {
            try {
                const userId  = interaction.fields.getTextInputValue('user_id').trim().replace(/[<@!>]/g, '');
                const role    = interaction.fields.getTextInputValue('role').trim();
                const salaryStr = interaction.fields.getTextInputValue('salary').trim();
                const salary  = parseInt(salaryStr);

                if (!['مدير', 'محاسب', 'موظف'].includes(role))
                    return interaction.reply({ content: '❌ Invalid rank. Enter: مدير, محاسب, or موظف.', flags: 64 });
                if (isNaN(salary) || salary < 0)
                    return interaction.reply({ content: '❌ Invalid salary. Enter a whole number.', flags: 64 });

                const company = await db.getCompanyByOwner(interaction.user.id);
                if (!company)
                    return interaction.reply({ content: '❌ You are not the owner of any company.', flags: 64 });

                if (userId === interaction.user.id)
                    return interaction.reply({ content: '❌ You cannot assign yourself.', flags: 64 });

                const existing = (await db.getCompanyMembers(company.id)).find(m => m.discord_id === userId);
                if (existing)
                    return interaction.reply({ content: '❌ This player is already an employee. Use the **Promote Employee** button to update their rank and salary.', flags: 64 });

                const res = await db.addCompanyMember(company.id, userId, role, salary);
                if (res.error) return interaction.reply({ content: `❌ ${res.error}`, flags: 64 });

                const embed = new EmbedBuilder().setTitle('Employee Assigned').setColor(0x1B5E20)
                    .addFields(
                        { name: '👤 Employee', value: `<@${userId}>`, inline: true },
                        { name: '🏷️ Rank',     value: `**${role}**`, inline: true },
                        { name: '💵 Salary',   value: `\`${salary.toLocaleString()} Riyals\``, inline: true },
                        { name: '🏢 Company',  value: company.name, inline: true },
                    ).setFooter({ text: 'Company System • FANTASY Bot' }).setTimestamp();
                return interaction.reply({ embeds: [embed] });
            } catch (e) {
                console.error('[COMP HIRE ERROR]', e);
                if (!interaction.replied) interaction.reply({ content: '❌ An error occurred. Make sure the player ID is correct.', flags: 64 });
            }
            return;
        }

        if (interaction.customId === 'comp_promote_modal') {
            try {
                const userId    = interaction.fields.getTextInputValue('user_id').trim().replace(/[<@!>]/g, '');
                const role      = interaction.fields.getTextInputValue('role').trim();
                const salaryStr = interaction.fields.getTextInputValue('salary').trim();
                const salary    = parseInt(salaryStr);

                if (!['مدير', 'محاسب', 'موظف'].includes(role))
                    return interaction.reply({ content: '❌ Invalid rank. Enter: مدير, محاسب, or موظف.', flags: 64 });
                if (isNaN(salary) || salary < 0)
                    return interaction.reply({ content: '❌ Invalid salary. Enter a whole number.', flags: 64 });

                const company = await db.getCompanyByOwner(interaction.user.id);
                if (!company)
                    return interaction.reply({ content: '❌ You are not the owner of any company.', flags: 64 });

                const member = (await db.getCompanyMembers(company.id)).find(m => m.discord_id === userId);
                if (!member)
                    return interaction.reply({ content: '❌ This player is not an employee of your company.', flags: 64 });

                await db.updateCompanyMemberRole(company.id, userId, role, salary);

                const embed = new EmbedBuilder().setTitle('Employee Promoted').setColor(0x6A1B9A)
                    .addFields(
                        { name: '👤 Employee',   value: `<@${userId}>`, inline: true },
                        { name: '🏷️ Old Rank',   value: `**${member.role}**`, inline: true },
                        { name: '🏷️ New Rank',   value: `**${role}**`, inline: true },
                        { name: '💵 New Salary',  value: `\`${salary.toLocaleString()} Riyals\``, inline: true },
                        { name: '🏢 Company',     value: company.name, inline: true },
                    ).setFooter({ text: 'Company System • FANTASY Bot' }).setTimestamp();
                return interaction.reply({ embeds: [embed] });
            } catch (e) {
                console.error('[COMP PROMOTE ERROR]', e);
                if (!interaction.replied) interaction.reply({ content: '❌ An error occurred. Make sure the player ID is correct.', flags: 64 });
            }
            return;
        }

        if (interaction.customId === 'comp_fire_modal') {
            try {
                const userId = interaction.fields.getTextInputValue('user_id').trim().replace(/[<@!>]/g, '');

                const company = await db.getCompanyByOwner(interaction.user.id);
                if (!company)
                    return interaction.reply({ content: '❌ You are not the owner of any company.', flags: 64 });

                if (userId === interaction.user.id)
                    return interaction.reply({ content: '❌ You cannot fire yourself.', flags: 64 });

                const removed = await db.removeCompanyMember(company.id, userId);
                if (!removed)
                    return interaction.reply({ content: '❌ This player is not an employee of your company.', flags: 64 });

                const embed = new EmbedBuilder().setTitle('Employee Fired').setColor(0xB71C1C)
                    .addFields(
                        { name: '👤 Employee', value: `<@${userId}>`, inline: true },
                        { name: '🏢 Company',  value: company.name, inline: true },
                    ).setFooter({ text: 'Company System • FANTASY Bot' }).setTimestamp();
                return interaction.reply({ embeds: [embed] });
            } catch (e) {
                console.error('[COMP FIRE ERROR]', e);
                if (!interaction.replied) interaction.reply({ content: '❌ An error occurred. Make sure the player ID is correct.', flags: 64 });
            }
            return;
        }

        if (interaction.customId === 'company_found_modal') {
            try {
                const personal    = interaction.fields.getTextInputValue('cf_personal').trim();
                const compName    = interaction.fields.getTextInputValue('cf_name').trim();
                const details     = interaction.fields.getTextInputValue('cf_details').trim();
                const management  = interaction.fields.getTextInputValue('cf_management').trim();
                const financial   = interaction.fields.getTextInputValue('cf_financial').trim();

                const identity = await db.getActiveIdentity(interaction.user.id);
                if (!identity)
                    return interaction.reply({ content: 'You are not logged in. Please log in first.', flags: 64 });

                const hasPerm = await db.hasTradePermit(interaction.user.id);
                if (!hasPerm)
                    return interaction.reply({ content: '❌ Your trade permit has expired or been revoked. Contact the **Ministry of Commerce**.', flags: 64 });

                const existingComp = await db.getUserCompany(interaction.user.id);
                if (existingComp)
                    return interaction.reply({ content: `❌ You are already linked to company **${existingComp.name}**.`, flags: 64 });

                const ministryChId = await db.getConfig('trade_ministry_channel');
                if (!ministryChId)
                    return interaction.reply({ content: '❌ Ministry of Commerce channel has not been set yet. Contact an Admin.', flags: 64 });

                const pending = await db.createPendingCompany({
                    discordId: interaction.user.id,
                    username: interaction.user.username,
                    companyName: compName,
                    personalInfo: personal,
                    companyDetails: details,
                    managementPlan: management,
                    financialInfo: financial,
                });

                await interaction.reply({
                    content: `⏳ **Your company founding request for «${compName}» (Request \`#${pending.id}\`) has been sent to the Ministry of Commerce.**\nYou will receive a response when it is approved or rejected.`,
                    flags: 64
                });

                try {
                    const ministryCh = await client.channels.fetch(ministryChId);
                    if (ministryCh) {
                        const appEmbed = new EmbedBuilder()
                            .setTitle(`📋 Company Founding Request — #${pending.id}`)
                            .setColor(0xF57F17)
                            .setThumbnail(interaction.user.displayAvatarURL())
                            .addFields(
                                { name: '👤 Applicant',         value: `<@${interaction.user.id}> — \`${interaction.user.username}\``, inline: false },
                                { name: '🏷️ Identity',          value: identity.character_name || '—', inline: true },
                                { name: '💰 Bank Balance',      value: `\`${(identity.balance || 0).toLocaleString()} Riyals\``, inline: true },
                                { name: '🏢 Company Name',      value: `**${compName}**`, inline: true },
                                { name: '👤 Personal Info',     value: `\`\`\`${personal}\`\`\``, inline: false },
                                { name: '🏪 Company Details',   value: `\`\`\`${details}\`\`\``, inline: false },
                                { name: '📊 Management Plan',   value: `\`\`\`${management}\`\`\``, inline: false },
                                { name: '💰 Financial Details', value: `\`\`\`${financial}\`\`\``, inline: false },
                            )
                            .setFooter({ text: `Request #${pending.id} • Pending Review` })
                            .setTimestamp();

                        const btnRow = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId(`approve_company_${pending.id}`).setLabel('✅ Approve').setStyle(ButtonStyle.Success),
                            new ButtonBuilder().setCustomId(`reject_company_${pending.id}`).setLabel('❌ Reject').setStyle(ButtonStyle.Danger),
                        );
                        await ministryCh.send({ embeds: [appEmbed], components: [btnRow] });
                    }
                } catch (e) { console.error('[COMPANY CHANNEL ERROR]', e); }
            } catch (e) {
                console.error('[COMPANY MODAL ERROR]', e);
                if (!interaction.replied)
                    return interaction.reply({ content: '❌ An error occurred while submitting the request.', flags: 64 });
            }
            return;
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
        const result = await command.slashExecute(interaction, db);
        if (interaction.commandName === 'سوق-الأسهم' && result?.id) {
            stockMarketMsg = result;
        }
    } catch (error) {
        console.error(`[SLASH ERROR] /${interaction.commandName}:`, error?.message || error);
        if (!interaction.replied && !interaction.deferred) {
            interaction.reply({ content: '❌ An error occurred while executing the command!', flags: 64 }).catch(() => {});
        }
    }
});

client.on('messageCreate', async message => {
    // ── معالجة كود إلغاء التراكينق عبر DM ──────────────────────────────────
    if (!message.guild && !message.author.bot) {
        const session = trackingSessions.get(message.author.id);
        if (session && message.content.trim().toUpperCase() === session.code) {
            clearTimeout(session.timer);
            trackingSessions.delete(message.author.id);
            try {
                await message.author.send('✅ **Tracking has been canceled successfully!** You entered the correct code.');
            } catch (_) {}
            try {
                const ch = await client.channels.fetch(session.channelId).catch(() => null);
                if (ch) {
                    const cancelEmbed = new EmbedBuilder()
                        .setTitle('Tracking Canceled')
                        .setColor(0xFF8F00)
                        .setDescription(
                            `🚫 <@${message.author.id}> canceled the tracking by entering the correct code.\n` +
                            `🔑 Code used: \`${session.code}\``
                        )
                        .setTimestamp();
                    ch.send({ content: `<@${session.trackerId}>`, embeds: [cancelEmbed] }).catch(() => {});
                }
            } catch (_) {}
        }
        return;
    }

    // حذف رسائل البوت — الإمبيدات وMessages ذات الأزرار وردود السلاش تبقى دائمة، فقط الردود النصية القصيرة تُحذف
    if (message.author.id === client.user?.id) {
        const hasEmbeds     = message.embeds.length > 0;
        const hasComponents = message.components.length > 0;
        const isInteraction = !!message.interaction || !!message.interactionMetadata;
        if (!hasEmbeds && !hasComponents && !isInteraction) {
            setTimeout(() => message.delete().catch(() => {}), 60_000);
        }
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
        console.error(`[CMD ERROR] ${commandName}:`, error?.message || error);
        message.reply('❌ An error occurred while executing the command!');
    }
});

// ── حماية حذف Messages — فقط أصحاب Rank الحذف يقدرون يحذفون ──────────
client.on('messageDelete', async (message) => {
    try {
        if (!message.guild) return;
        if (message.partial) return;
        if (message.author?.bot) return;

        const deleteRoleId = await db.getConfig('delete_role_id');
        if (!deleteRoleId) return;

        const logs = await message.guild.fetchAuditLogs({
            type: AuditLogEvent.MessageDelete,
            limit: 1
        });
        const entry = logs.entries.first();
        if (!entry) return;
        if (Date.now() - entry.createdTimestamp > 5000) return;
        if (entry.target?.id !== message.author.id) return;

        const executor = await message.guild.members.fetch(entry.executor.id).catch(() => null);
        if (!executor) return;
        if (executor.id === client.user.id) return;
        if (executor.roles.cache.has(deleteRoleId)) return;

        const content = message.content || '';
        const embeds = message.embeds || [];
        if (!content && embeds.length === 0) return;

        const restoreEmbed = new EmbedBuilder()
            .setColor(0xE53935)
            .setTitle('Unauthorized Deletion')
            .setDescription(`**${executor.displayName}** deleted a message without permission — it has been restored:`)
            .addFields(
                { name: '👤 Message Author', value: `<@${message.author.id}>`, inline: true },
                { name: '🗑️ Deleted by',     value: `<@${executor.id}>`, inline: true },
            )
            .setFooter({ text: 'Delete Protection System • FANTASY Bot' })
            .setTimestamp();

        if (content) restoreEmbed.addFields({ name: '📝 Message', value: content.slice(0, 1024) });

        await message.channel.send({ embeds: [restoreEmbed, ...embeds] });
    } catch (_) {}
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

                    // إزالة Rank الباند
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
                    await user.send(`✅ **Your violation in server ${guild?.name || 'the server'} has expired — the ban has been lifted and all your roles have been restored automatically.**`);
                } catch (_) {}
            } catch (e) { console.error('violation cleanup error:', e); }
        }
    } catch (e) { console.error('violation interval error:', e); }
}, 60_000);

// ── Health check server for deployment ──────────────────────────────────
const http = require('http');
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
}).listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_TOKEN);
