const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('Reset Menu').setEmoji({ id: '1479212270746599528', name: 'GL137', animated: true }).setStyle(ButtonStyle.Secondary);

const SLOT_NAMES = { 1: 'Slot 1', 2: 'Slot 2', 3: 'Slot 3' };

module.exports = {
    name: 'تعديل-إيبان',
    data: new SlashCommandBuilder()
        .setName('تعديل-إيبان')
        .setDescription('Edit the IBAN for a player character slot')
        .addUserOption(o => o.setName('اللاعب').setDescription('The player to target').setRequired(true))
        .addIntegerOption(o => o.setName('الخانة').setDescription('Slot number (1, 2, or 3)').setRequired(true)
            .addChoices(
                { name: 'Slot 1', value: 1 },
                { name: 'Slot 2', value: 2 },
                { name: 'Slot 3', value: 3 },
            ))
        .addStringOption(o => o.setName('الإيبان-الجديد').setDescription('New IBAN (digits only)').setRequired(true)),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ You do not have permission.', flags: 64 });

        const target  = interaction.options.getUser('اللاعب');
        const slot    = interaction.options.getInteger('الخانة');
        const newIban = interaction.options.getString('الإيبان-الجديد').trim();

        if (!/^\d+$/.test(newIban))
            return interaction.reply({ content: '❌ IBAN must contain **digits only**.', flags: 64 });

        const result = await db.updateIban(target.id, slot, newIban);
        if (!result.success)
            return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });

        const _img = await db.getImage('bank').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('IBAN Updated')
            .setColor(0xE53935)
            .addFields(
                { name: '👤 Player',   value: `<@${target.id}>`, inline: true },
                { name: '📌 Slot',     value: SLOT_NAMES[slot],   inline: true },
                { name: '🏦 New IBAN', value: `\`${newIban}\``,   inline: true },
            )
            .setFooter({ text: 'Bank System • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);
        await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetButton)] });
        return interaction.reply({ content: '​', flags: 64 });
    },

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
            return message.reply('❌ You do not have permission.');

        const target  = message.mentions.users.first();
        const slot    = parseInt(args[1]);
        const newIban = args[2];

        if (!target) return message.reply('❌ Usage: `-تعديل-إيبان @player [slot] [newIBAN]`');
        if (![1, 2, 3].includes(slot)) return message.reply('❌ Slot must be 1, 2, or 3.');
        if (!newIban || !/^\d+$/.test(newIban)) return message.reply('❌ IBAN must contain digits only.');

        const result = await db.updateIban(target.id, slot, newIban);
        if (!result.success) return message.reply(`❌ ${result.error}`);

        const _img = await db.getImage('bank').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('IBAN Updated')
            .setColor(0xE53935)
            .addFields(
                { name: '👤 Player',   value: `<@${target.id}>`, inline: true },
                { name: '📌 Slot',     value: SLOT_NAMES[slot],   inline: true },
                { name: '🏦 New IBAN', value: `\`${newIban}\``,   inline: true },
            )
            .setFooter({ text: 'Bank System • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);
        return message.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetButton)] });
    },
};
