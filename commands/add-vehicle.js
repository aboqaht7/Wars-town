const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ensureOwnerRole } = require('../utils');

async function finalize({ guild, member, target, carName, plate, addedByMention, channel, db }) {
    await db.ensureUser(target.id, target.user?.username || target.username);
    const result = await db.addVehicle(target.id, carName, plate);
    if (!result.success) return { ok: false, error: result.error };

    let roleId = null;
    try {
        const targetMember = member && member.id === target.id
            ? member
            : await guild.members.fetch(target.id).catch(() => null);
        if (targetMember) {
            roleId = await ensureOwnerRole(guild, targetMember, carName);
            if (roleId) await db.setVehicleRoleId(plate, roleId).catch(() => {});
        }
    } catch (e) { console.error('[add-vehicle role]', e?.message); }

    const _img = await db.getImage('vehicles').catch(() => null);
    const embed = new EmbedBuilder()
        .setTitle('Car Registered')
        .setColor(0xE53935)
        .addFields(
            { name: '👤 Owner',           value: `<@${target.id}>`,                inline: true },
            { name: '🚗 Car Name',        value: `\`${carName}\``,                  inline: true },
            { name: '🔖 Plate',           value: `\`${plate}\``,                    inline: true },
            { name: '🎖️ Ownership Role', value: roleId ? `<@&${roleId}>` : '—', inline: true },
            { name: '👮 Added By',        value: addedByMention,                    inline: true },
        )
        .setFooter({ text: 'Vehicles System • FANTASY Bot' })
        .setTimestamp();
    if (_img) embed.setImage(_img);
    await channel.send({ embeds: [embed] });
    return { ok: true };
}

module.exports = {
    name: 'اضافة-سيارة',
    data: new SlashCommandBuilder()
        .setName('اضافة-سيارة')
        .setDescription('Add a new car to a player')
        .addUserOption(opt => opt.setName('لاعب').setDescription('The player to add the car to').setRequired(true))
        .addStringOption(opt => opt.setName('اسم-السيارة').setDescription('Car name ونوعها').setRequired(true))
        .addStringOption(opt => opt.setName('لوحة').setDescription('Car license plate number').setRequired(true)),
    async execute(message, args, db) {
        const target = message.mentions.members?.first();
        const carName = args.filter(a => !a.startsWith('<@')).slice(0, -1).join(' ') || args.filter(a => !a.startsWith('<@'))[0];
        const plate = args[args.length - 1];
        if (!target || !carName || !plate) {
            return message.reply('❌ Usage: `-اضافة-سيارة @player [Car name] [Plate number]`\nExample: `-اضافة-سيارة @player Camry ABC123`');
        }
        const r = await finalize({
            guild: message.guild,
            member: message.member,
            target,
            carName,
            plate,
            addedByMention: `${message.author}`,
            channel: message.channel,
            db,
        });
        if (!r.ok) return message.reply(`❌ ${r.error}`);
    },
    async slashExecute(interaction, db) {
        const target = interaction.options.getUser('لاعب');
        const carName = interaction.options.getString('اسم-السيارة');
        const plate = interaction.options.getString('لوحة');
        const targetMember = await interaction.guild.members.fetch(target.id).catch(() => null);
        const r = await finalize({
            guild: interaction.guild,
            member: targetMember,
            target,
            carName,
            plate,
            addedByMention: `${interaction.user}`,
            channel: interaction.channel,
            db,
        });
        if (!r.ok) return interaction.reply({ content: `❌ ${r.error}`, flags: 64 });
        await interaction.deferReply({ flags: 64 }).catch(() => {});
        await interaction.deleteReply().catch(() => {});
    }
};
