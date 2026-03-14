const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'police',
    data: new SlashCommandBuilder()
        .setName('police')
        .setDescription('نظام الشرطة'),
    async execute(message, args, db) {
        const embed = new EmbedBuilder()
            .setTitle('👮 نظام الشرطة')
            .setColor(0x1565C0)
            .setDescription('مرحباً بك في نظام الشرطة\nاستخدم الأوامر النصية التالية:')
            .addFields(
                { name: '🔗 كلبشة', value: '`-كلبشة @اللاعب`', inline: true },
                { name: '🚨 تلويت', value: '`-تلويت @اللاعب`', inline: true },
                { name: '🚫 باند', value: '`-باند @اللاعب السبب`', inline: true },
                { name: '📢 تشهير', value: '`-تشهير @اللاعب السبب`', inline: true },
            )
            .setImage(await db.getImage('police') || null)
            .setFooter({ text: 'نظام الشرطة • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('police_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: '🔗 كلبشة', value: 'handcuff' },
                    { label: '🚨 تلويت', value: 'wanted' },
                    { label: '🚫 باند', value: 'ban' },
                    { label: '📢 تشهير', value: 'defame' },
                ])
        );
        message.channel.send({ embeds: [embed], components: [menu] });
    },
    async slashExecute(interaction, db) {
        const embed = new EmbedBuilder()
            .setTitle('👮 نظام الشرطة')
            .setColor(0x1565C0)
            .setDescription('مرحباً بك في نظام الشرطة\nاستخدم الأوامر النصية التالية:')
            .addFields(
                { name: '🔗 كلبشة', value: '`-كلبشة @اللاعب`', inline: true },
                { name: '🚨 تلويت', value: '`-تلويت @اللاعب`', inline: true },
                { name: '🚫 باند', value: '`-باند @اللاعب السبب`', inline: true },
                { name: '📢 تشهير', value: '`-تشهير @اللاعب السبب`', inline: true },
            )
            .setImage(await db.getImage('police') || null)
            .setFooter({ text: 'نظام الشرطة • بوت FANTASY' })
            .setTimestamp();
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('police_menu')
                .setPlaceholder('اختر خيار')
                .addOptions([
                    { label: '🔗 كلبشة', value: 'handcuff' },
                    { label: '🚨 تلويت', value: 'wanted' },
                    { label: '🚫 باند', value: 'ban' },
                    { label: '📢 تشهير', value: 'defame' },
                ])
        );
        interaction.reply({ embeds: [embed], components: [menu] });
    }
};
