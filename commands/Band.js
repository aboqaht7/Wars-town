const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resetRow } = require('../utils');

module.exports = {
    name: 'police',
    data: new SlashCommandBuilder()
        .setName('police')
        .setDescription('نظام الشرطة'),
    async execute(message, args, db) {
        const { embed, menu } = await build(message.author.username, db);
        message.channel.send({ embeds: [embed], components: [menu, resetRow('police')] });
    },
    async slashExecute(interaction, db) {
        const { embed, menu } = await build(interaction.user.username, db);
        interaction.reply({ embeds: [embed], components: [menu, resetRow('police')] });
    }
};

async function build(username, db) {
    const embed = new EmbedBuilder()
        .setTitle('👮 نظام الشرطة')
        .setColor(0x1565C0)
        .setDescription('مرحباً بك في نظام الشرطة\nاستخدم الأوامر النصية التالية:')
        .addFields(
            { name: '🔗 كلبشة', value: '`-كلبشة @اللاعب`', inline: true },
            { name: '🚨 تلويت', value: '`-تلويت @اللاعب`', inline: true },
            { name: '🚫 باند', value: '`-باند @اللاعب السبب`', inline: true },
            { name: '📢 تشهير', value: '`-تشهير @اللاعب السبب`', inline: true },
            { name: '🔓 فك كلبشة', value: '`-فك-كلبشة @اللاعب`', inline: true },
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
                { label: '🔓 فك كلبشة', value: 'unchuff' },
            ])
    );
    return { embed, menu };
}
