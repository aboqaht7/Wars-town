const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'identity',
    data: new SlashCommandBuilder()
        .setName('identity')
        .setDescription('عرض وتغيير الهوية'),
    async execute(message, args, db) {
        await db.ensureUser(message.author.id, message.author.username);
        const activeSlot = await db.getActiveSlot(message.author.id);
        const identity = await db.ensureIdentity(message.author.id, activeSlot);
        const embed = new EmbedBuilder()
            .setTitle('🪪 نظام الهوية')
            .setColor(0x4A148C)
            .setDescription(`الشخصية النشطة حالياً: **شخصية ${activeSlot}**`)
            .addFields(
                { name: '🏦 إيبان الحساب', value: `\`${identity.iban}\``, inline: true },
                { name: '💰 الرصيد', value: `\`${Number(identity.balance).toLocaleString()} ريال\``, inline: true },
                { name: '👤 اسم الشخصية', value: identity.character_name || `شخصية ${activeSlot}`, inline: true },
            )
            .setImage(await db.getImage('identity') || null)
            .setFooter({ text: 'نظام الهوية • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('identity_menu')
                .setPlaceholder('اختر شخصيتك للتبديل')
                .addOptions([
                    { label: '👤 شخصية 1', value: 'char_1', description: 'التبديل للشخصية الأولى' },
                    { label: '👤 شخصية 2', value: 'char_2', description: 'التبديل للشخصية الثانية' },
                    { label: '🔒 شخصية 3', value: 'char_3', description: 'التبديل للشخصية الثالثة' },
                    { label: '🔒 شخصية 4', value: 'char_4', description: 'التبديل للشخصية الرابعة' },
                ])
        );
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        await db.ensureUser(interaction.user.id, interaction.user.username);
        const activeSlot = await db.getActiveSlot(interaction.user.id);
        const identity = await db.ensureIdentity(interaction.user.id, activeSlot);
        const embed = new EmbedBuilder()
            .setTitle('🪪 نظام الهوية')
            .setColor(0x4A148C)
            .setDescription(`الشخصية النشطة حالياً: **شخصية ${activeSlot}**`)
            .addFields(
                { name: '🏦 إيبان الحساب', value: `\`${identity.iban}\``, inline: true },
                { name: '💰 الرصيد', value: `\`${Number(identity.balance).toLocaleString()} ريال\``, inline: true },
                { name: '👤 اسم الشخصية', value: identity.character_name || `شخصية ${activeSlot}`, inline: true },
            )
            .setImage(await db.getImage('identity') || null)
            .setFooter({ text: 'نظام الهوية • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('identity_menu')
                .setPlaceholder('اختر شخصيتك للتبديل')
                .addOptions([
                    { label: '👤 شخصية 1', value: 'char_1', description: 'التبديل للشخصية الأولى' },
                    { label: '👤 شخصية 2', value: 'char_2', description: 'التبديل للشخصية الثانية' },
                    { label: '🔒 شخصية 3', value: 'char_3', description: 'التبديل للشخصية الثالثة' },
                    { label: '🔒 شخصية 4', value: 'char_4', description: 'التبديل للشخصية الرابعة' },
                ])
        );
        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
