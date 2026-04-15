const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'فتح-شخصية-ثالثة',
    async execute(message, args, db) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply('❌ هذا الأمر للمسؤولين فقط.');
        }
        const target = message.mentions.users.first();
        if (!target) return message.reply('❌ يجب ذكر اللاعب: `-فتح-شخصية-ثالثة @اللاعب`');

        await db.ensureUser(target.id, target.username);
        const alreadyUnlocked = await db.isSlot3Unlocked(target.id);
        if (alreadyUnlocked) {
            return message.reply(`❌ الشخصية الثالثة مفتوحة بالفعل لـ **${target.username}**.`);
        }

        await db.unlockSlot3(target.id);

        const _img = await db.getImage('identity').catch(() => null);


        const embed = new EmbedBuilder()
            .setTitle('تم فتح الشخصية الثالثة')
            .setColor(0x6A1B9A)
            .setDescription(`تم فتح **الشخصية الثالثة** للاعب <@${target.id}>`)
            .addFields(
                { name: '👤 اللاعب', value: `<@${target.id}> — \`${target.username}\``, inline: true },
                { name: '✅ الحالة', value: 'الشخصية الثالثة متاحة الآن للإنشاء', inline: true },
            )
            .setFooter({ text: 'Identity System • FANTASY Bot' })
            .setTimestamp();

        if (_img) embed.setImage(_img);
        message.channel.send({ embeds: [embed] });

        try {
            await target.send('🔓 **تم فتح الشخصية الثالثة لك!**\nيمكنك الآن إنشاء هوية في الشخصية الثالثة عبر `/identity`.');
        } catch {}
    }
};
