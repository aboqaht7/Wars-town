const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'bank',
    data: new SlashCommandBuilder()
        .setName('bank')
        .setDescription('عرض البنك ورصيد الهوية النشطة'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const identity = await db.getActiveIdentity(message.author.id);
        const embed = new EmbedBuilder()
            .setTitle('🏦 البنك الوطني')
            .setColor(0x2E7D32)
            .setDescription(`مرحباً **${message.author.username}** — شخصية ${identity.slot}`)
            .addFields(
                { name: '🏦 رقم الإيبان', value: `\`${identity.iban}\``, inline: true },
                { name: '💰 الرصيد الحالي', value: `\`${Number(identity.balance).toLocaleString()} ريال\``, inline: true },
                { name: '💸 تحويل الأموال', value: '`-تحويل [إيبان] [مبلغ]`', inline: false },
            )
            .setImage(await db.getImage('bank') || null)
            .setFooter({ text: 'نظام البنك • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('bank_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: '💰 عرض الرصيد', value: 'balance' },
                    { label: '💸 كيفية التحويل', value: 'transfer_help' },
                    { label: '🏦 رقم الإيبان', value: 'iban' },
                ])
        );
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const identity = await db.getActiveIdentity(interaction.user.id);
        const embed = new EmbedBuilder()
            .setTitle('🏦 البنك الوطني')
            .setColor(0x2E7D32)
            .setDescription(`مرحباً **${interaction.user.username}** — شخصية ${identity.slot}`)
            .addFields(
                { name: '🏦 رقم الإيبان', value: `\`${identity.iban}\``, inline: true },
                { name: '💰 الرصيد الحالي', value: `\`${Number(identity.balance).toLocaleString()} ريال\``, inline: true },
                { name: '💸 تحويل الأموال', value: '`-تحويل [إيبان] [مبلغ]`', inline: false },
            )
            .setImage(await db.getImage('bank') || null)
            .setFooter({ text: 'نظام البنك • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('bank_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: '💰 عرض الرصيد', value: 'balance' },
                    { label: '💸 كيفية التحويل', value: 'transfer_help' },
                    { label: '🏦 رقم الإيبان', value: 'iban' },
                ])
        );
        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
