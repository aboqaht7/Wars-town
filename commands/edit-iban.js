const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);

module.exports = {
    name: 'تعديل-إيبان',
    data: new SlashCommandBuilder()
        .setName('تعديل-إيبان')
        .setDescription('تعديل إيبان هوية لاعب معين')
        .addUserOption(o => o.setName('اللاعب').setDescription('اللاعب المراد تعديل إيبانه').setRequired(true))
        .addIntegerOption(o => o.setName('الخانة').setDescription('رقم الخانة (1، 2، أو 3)').setRequired(true)
            .addChoices(
                { name: 'الخانة 1', value: 1 },
                { name: 'الخانة 2', value: 2 },
                { name: 'الخانة 3', value: 3 },
            ))
        .addStringOption(o => o.setName('الإيبان-الجديد').setDescription('الإيبان الجديد (أرقام فقط)').setRequired(true)),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ ليس لديك صلاحية.', flags: 64 });

        const target  = interaction.options.getUser('اللاعب');
        const slot    = interaction.options.getInteger('الخانة');
        const newIban = interaction.options.getString('الإيبان-الجديد').trim();

        if (!/^\d+$/.test(newIban))
            return interaction.reply({ content: '❌ الإيبان يجب أن يحتوي على **أرقام فقط**.', flags: 64 });

        const result = await db.updateIban(target.id, slot, newIban);
        if (!result.success)
            return interaction.reply({ content: `❌ ${result.error}`, flags: 64 });

        const slotNames = { 1: 'الخانة الأولى', 2: 'الخانة الثانية', 3: 'الخانة الثالثة' };
        const embed = new EmbedBuilder()
            .setTitle('✅ تم تعديل الإيبان')
            .setColor(0x1B5E20)
            .addFields(
                { name: '👤 اللاعب',     value: `<@${target.id}>`,   inline: true },
                { name: '📌 الخانة',     value: slotNames[slot],      inline: true },
                { name: '🏦 الإيبان الجديد', value: `\`${newIban}\``, inline: true },
            )
            .setFooter({ text: 'نظام البنك • بوت FANTASY' })
            .setTimestamp();

        await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetButton)] });
        return interaction.reply({ content: '​', flags: 64 });
    },

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
            return message.reply('❌ ليس لديك صلاحية.');

        const target  = message.mentions.users.first();
        const slot    = parseInt(args[1]);
        const newIban = args[2];

        if (!target) return message.reply('❌ الاستخدام: `-تعديل-إيبان @اللاعب [الخانة] [الإيبان الجديد]`');
        if (![1, 2, 3].includes(slot)) return message.reply('❌ الخانة يجب أن تكون 1 أو 2 أو 3.');
        if (!newIban || !/^\d+$/.test(newIban)) return message.reply('❌ الإيبان يجب أن يحتوي على أرقام فقط.');

        const result = await db.updateIban(target.id, slot, newIban);
        if (!result.success) return message.reply(`❌ ${result.error}`);

        const slotNames = { 1: 'الخانة الأولى', 2: 'الخانة الثانية', 3: 'الخانة الثالثة' };
        const embed = new EmbedBuilder()
            .setTitle('✅ تم تعديل الإيبان')
            .setColor(0x1B5E20)
            .addFields(
                { name: '👤 اللاعب',         value: `<@${target.id}>`,  inline: true },
                { name: '📌 الخانة',         value: slotNames[slot],     inline: true },
                { name: '🏦 الإيبان الجديد', value: `\`${newIban}\``,    inline: true },
            )
            .setFooter({ text: 'نظام البنك • بوت FANTASY' })
            .setTimestamp();

        return message.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetButton)] });
    },
};
