const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'bank',
    data: new SlashCommandBuilder()
        .setName('bank')
        .setDescription('عرض البنك والتحويلات'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const balance = await db.getBalance(message.author.id);
        const embed = new EmbedBuilder()
            .setTitle('🏦 البنك الوطني')
            .setColor(0x2E7D32)
            .setDescription(`مرحباً **${message.author.username}** في بنكك الشخصي`)
            .addFields(
                { name: '💰 الرصيد الحالي', value: `\`${Number(balance).toLocaleString()} ريال\``, inline: true },
                { name: '📊 الحالة', value: '`نشط`', inline: true },
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
                    { label: '💸 تحويل مبلغ', value: 'transfer' },
                    { label: '📥 إيداع', value: 'deposit' },
                    { label: '📤 سحب', value: 'withdraw' },
                ])
        );
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const balance = await db.getBalance(interaction.user.id);
        const embed = new EmbedBuilder()
            .setTitle('🏦 البنك الوطني')
            .setColor(0x2E7D32)
            .setDescription(`مرحباً **${interaction.user.username}** في بنكك الشخصي`)
            .addFields(
                { name: '💰 الرصيد الحالي', value: `\`${Number(balance).toLocaleString()} ريال\``, inline: true },
                { name: '📊 الحالة', value: '`نشط`', inline: true },
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
                    { label: '💸 تحويل مبلغ', value: 'transfer' },
                    { label: '📥 إيداع', value: 'deposit' },
                    { label: '📤 سحب', value: 'withdraw' },
                ])
        );
        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
