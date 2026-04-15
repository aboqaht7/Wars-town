const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

async function getAdminRole(db) {
    return db.getConfig('bank_admin_role');
}

async function hasAdminRole(member, db) {
    const roleId = await getAdminRole(db);
    if (!roleId) return member.permissions.has(PermissionFlagsBits.ManageGuild);
    return member.roles.cache.has(roleId);
}

module.exports = {
    name: 'بنك-أدمن',
    async execute(message, args, db) {
        if (!(await hasAdminRole(message.member, db))) {
            return message.reply('❌ هذا الأمر للمسؤولين فقط.');
        }

        const sub = args[0];
        const validSubs = ['إضافة', 'سحب', 'تجميد', 'فك-تجميد', 'حساب'];
        if (!sub || !validSubs.includes(sub)) {
            return message.reply(
                '**أوامر أدمن Bank:**\n' +
                '`-بنك-أدمن إضافة [إيبان] [المبلغ] [ملاحظة اختيارية]`\n' +
                '`-بنك-أدمن سحب [إيبان] [المبلغ] [ملاحظة اختيارية]`\n' +
                '`-بنك-أدمن تجميد [إيبان]`\n' +
                '`-بنك-أدمن فك-تجميد [إيبان]`\n' +
                '`-بنك-أدمن حساب [@مستخدم أو إيبان]`'
            );
        }

        if (sub === 'إضافة') {
            const iban = args[1];
            const amount = parseInt(args[2]);
            const note = args.slice(3).join(' ') || null;
            if (!iban || isNaN(amount) || amount <= 0)
                return message.reply('❌ الاستخدام: `-بنك-أدمن إضافة [إيبان] [المبلغ]`');

            const result = await db.adminAddMoney(iban, amount, note);
            if (!result.success) return message.reply(`❌ ${result.error}`);

            const _img = await db.getImage('bank').catch(() => null);


            const embed = new EmbedBuilder()
                .setTitle('Balance Added')
                .setColor(0x2E7D32)
                .addFields(
                    { name: '🏦 IBAN', value: `\`${iban}\``, inline: true },
                    { name: '👤 Character', value: `${result.char.character_name} ${result.char.family_name || ''}`, inline: true },
                    { name: '💰 Amount Added', value: `${amount.toLocaleString()} ريال`, inline: true },
                    { name: '💼 New Balance', value: `${Number(result.newBalance).toLocaleString()} ريال`, inline: true },
                    { name: '🔧 By', value: `<@${message.author.id}>`, inline: true },
                    { name: '📝 ملاحظة', value: note || '—', inline: true },
                )
                .setFooter({ text: 'Bank Admin • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            return message.channel.send({ embeds: [embed] });
        }

        if (sub === 'سحب') {
            const iban = args[1];
            const amount = parseInt(args[2]);
            const note = args.slice(3).join(' ') || null;
            if (!iban || isNaN(amount) || amount <= 0)
                return message.reply('❌ الاستخدام: `-بنك-أدمن سحب [إيبان] [المبلغ]`');

            const result = await db.adminRemoveMoney(iban, amount, note);
            if (!result.success) return message.reply(`❌ ${result.error}`);

            const _img = await db.getImage('bank').catch(() => null);


            const embed = new EmbedBuilder()
                .setTitle('Balance Withdrawn')
                .setColor(0xB71C1C)
                .addFields(
                    { name: '🏦 IBAN', value: `\`${iban}\``, inline: true },
                    { name: '👤 Character', value: `${result.char.character_name} ${result.char.family_name || ''}`, inline: true },
                    { name: '💰 Amount Withdrawn', value: `${amount.toLocaleString()} ريال`, inline: true },
                    { name: '💼 New Balance', value: `${Number(result.newBalance).toLocaleString()} ريال`, inline: true },
                    { name: '🔧 By', value: `<@${message.author.id}>`, inline: true },
                    { name: '📝 ملاحظة', value: note || '—', inline: true },
                )
                .setFooter({ text: 'Bank Admin • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            return message.channel.send({ embeds: [embed] });
        }

        if (sub === 'تجميد') {
            const iban = args[1];
            if (!iban) return message.reply('❌ الاستخدام: `-بنك-أدمن تجميد [إيبان]`');

            const char = await db.freezeAccount(iban);
            if (!char) return message.reply(`❌ لا يوجد حساب بالإيبان \`${iban}\``);

            const _img = await db.getImage('bank').catch(() => null);


            const embed = new EmbedBuilder()
                .setTitle('Account Frozen')
                .setColor(0x0288D1)
                .addFields(
                    { name: '🏦 IBAN', value: `\`${iban}\``, inline: true },
                    { name: '👤 Character', value: `${char.character_name} ${char.family_name || ''}`, inline: true },
                    { name: '🔧 By', value: `<@${message.author.id}>`, inline: true },
                )
                .setFooter({ text: 'Bank Admin • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            return message.channel.send({ embeds: [embed] });
        }

        if (sub === 'فك-تجميد') {
            const iban = args[1];
            if (!iban) return message.reply('❌ الاستخدام: `-بنك-أدمن فك-تجميد [إيبان]`');

            const char = await db.unfreezeAccount(iban);
            if (!char) return message.reply(`❌ لا يوجد حساب بالإيبان \`${iban}\``);

            const _img = await db.getImage('bank').catch(() => null);


            const embed = new EmbedBuilder()
                .setTitle('Account Unfrozen')
                .setColor(0x2E7D32)
                .addFields(
                    { name: '🏦 IBAN', value: `\`${iban}\``, inline: true },
                    { name: '👤 Character', value: `${char.character_name} ${char.family_name || ''}`, inline: true },
                    { name: '🔧 By', value: `<@${message.author.id}>`, inline: true },
                )
                .setFooter({ text: 'Bank Admin • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            return message.channel.send({ embeds: [embed] });
        }

        if (sub === 'حساب') {
            const mentioned = message.mentions.users.first();
            const ibanArg = args[1];
            let chars = [];

            if (mentioned) {
                chars = await db.getIdentitiesByDiscordId(mentioned.id);
                if (!chars.length) return message.reply('❌ لا توجد شخصيات لهذا المستخدم.');
            } else if (ibanArg) {
                const c = await db.getIdentityByIban(ibanArg);
                if (!c) return message.reply(`❌ لا يوجد حساب بالإيبان \`${ibanArg}\``);
                chars = [c];
            } else {
                return message.reply('❌ الاستخدام: `-بنك-أدمن حساب [@مستخدم أو إيبان]`');
            }

            const SLOT_NAMES = { 1: 'الشخصية الأولى', 2: 'الشخصية الثانية', 3: 'الشخصية الثالثة' };
            const _img = await db.getImage('bank').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle(`🏦 حسابات ${mentioned ? mentioned.username : chars[0].character_name}`)
                .setColor(0x1565C0)
                .setFooter({ text: 'Bank Admin • FANTASY Bot' }).setTimestamp();

            for (const c of chars) {
                embed.addFields({
                    name: `${SLOT_NAMES[c.slot] || `شخصية ${c.slot}`} — ${c.character_name} ${c.family_name || ''}`,
                    value: `🏦 إيبان: \`${c.iban}\`\n💰 الرصيد: \`${Number(c.balance).toLocaleString()} ريال\`\n${c.frozen ? '❄️ **Frozen**' : '✅ Active'}`,
                    inline: false,
                });
            }
            if (_img) embed.setImage(_img);
            return message.channel.send({ embeds: [embed] });
        }
    },
};
