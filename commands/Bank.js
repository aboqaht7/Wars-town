const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'bank',
    data: new SlashCommandBuilder()
        .setName('bank')
        .setDescription('عرض البنك ورصيد الهوية النشطة'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const identity = await db.getActiveIdentity(message.author.id);
        const { embed, menu } = build(message.author.username, identity, await db.getImage('bank'));
        message.channel.send({ embeds: [embed], components: [menu, resetRow('bank')] });
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const identity = await db.getActiveIdentity(interaction.user.id);
        const { embed, menu } = build(interaction.user.username, identity, await db.getImage('bank'));
        interaction.reply({ embeds: [embed], components: [menu, resetRow('bank')] });
    }
};

function build(username, identity, image) {
    const embed = new EmbedBuilder()
        .setTitle('🏦 البنك الوطني')
        .setColor(0x2E7D32)
        .setDescription(`مرحباً **${username}** — شخصية ${identity.slot}`)
        .addFields(
            { name: '🏦 رقم الإيبان', value: `\`${identity.iban}\``, inline: true },
            { name: '💰 الرصيد الحالي', value: `\`${Number(identity.balance).toLocaleString()} ريال\``, inline: true },
            { name: '💸 تحويل الأموال', value: '`-تحويل [إيبان] [مبلغ]`', inline: false },
        )
        .setImage(image || null)
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
    return { embed, menu };
}
