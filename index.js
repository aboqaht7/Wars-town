const fs = require('fs');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { QuickDB } = require('quick.db');
require('dotenv').config();

const db = new QuickDB();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.slashExecute(interaction, db);
    } catch (error) {
        console.error(error);
        interaction.reply({ content: 'حدث خطأ أثناء تنفيذ الأمر!', ephemeral: true });
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
