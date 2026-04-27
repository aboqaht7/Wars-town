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
            return message.reply('❌ This command is for admins only.');
        }

        const sub = args[0];
        const validSubs = ['إضافة', 'سحب', 'تجميد', 'فك-تجميد', 'حساب'];
        if (!sub || !validSubs.includes(sub)) {
            return message.reply(
                '**Bank Admin Commands:**\n' +
                '`-بنك-أدمن إضافة [IBAN] [Amount] [Optional Note]`\n' +
                '`-بنك-أدمن سحب [IBAN] [Amount] [Optional Note]`\n' +
                '`-بنك-أدمن تجميد [IBAN]`\n' +
                '`-بنك-أدمن فك-تجميد [IBAN]`\n' +
                '`-بنك-أدمن حساب [@user or IBAN]`'
            );
        }

        if (sub === 'إضافة') {
            const iban = args[1];
            const amount = parseInt(args[2]);
            const note = args.slice(3).join(' ') || null;
            if (!iban || isNaN(amount) || amount <= 0)
                return message.reply('❌ Usage: `-بنك-أدمن إضافة [IBAN] [Amount]`');

            const result = await db.adminAddMoney(iban, amount, note);
            if (!result.success) return message.reply(`❌ ${result.error}`);

            const _img = await db.getImage('bank').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Balance Added')
                .setColor(0x2E7D32)
                .addFields(
                    { name: '🏦 IBAN', value: `\`${iban}\``, inline: true },
                    { name: '👤 Character', value: `${result.char.character_name} ${result.char.family_name || ''}`, inline: true },
                    { name: '💰 Amount Added', value: `${amount.toLocaleString()} Riyals`, inline: true },
                    { name: '💼 New Balance', value: `${Number(result.newBalance).toLocaleString()} Riyals`, inline: true },
                    { name: '🔧 By', value: `<@${message.author.id}>`, inline: true },
                    { name: '📝 Note', value: note || '—', inline: true },
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
                return message.reply('❌ Usage: `-بنك-أدمن سحب [IBAN] [Amount]`');

            const result = await db.adminRemoveMoney(iban, amount, note);
            if (!result.success) return message.reply(`❌ ${result.error}`);

            const _img = await db.getImage('bank').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle('Balance Withdrawn')
                .setColor(0xB71C1C)
                .addFields(
                    { name: '🏦 IBAN', value: `\`${iban}\``, inline: true },
                    { name: '👤 Character', value: `${result.char.character_name} ${result.char.family_name || ''}`, inline: true },
                    { name: '💰 Amount Withdrawn', value: `${amount.toLocaleString()} Riyals`, inline: true },
                    { name: '💼 New Balance', value: `${Number(result.newBalance).toLocaleString()} Riyals`, inline: true },
                    { name: '🔧 By', value: `<@${message.author.id}>`, inline: true },
                    { name: '📝 Note', value: note || '—', inline: true },
                )
                .setFooter({ text: 'Bank Admin • FANTASY Bot' }).setTimestamp();
            if (_img) embed.setImage(_img);
            return message.channel.send({ embeds: [embed] });
        }

        if (sub === 'تجميد') {
            const iban = args[1];
            if (!iban) return message.reply('❌ Usage: `-بنك-أدمن تجميد [IBAN]`');

            const char = await db.freezeAccount(iban);
            if (!char) return message.reply(`❌ No account found with IBAN \`${iban}\``);

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
            if (!iban) return message.reply('❌ Usage: `-بنك-أدمن فك-تجميد [IBAN]`');

            const char = await db.unfreezeAccount(iban);
            if (!char) return message.reply(`❌ No account found with IBAN \`${iban}\``);

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
                if (!chars.length) return message.reply('❌ No characters found for this user.');
            } else if (ibanArg) {
                const c = await db.getIdentityByIban(ibanArg);
                if (!c) return message.reply(`❌ No account found with IBAN \`${ibanArg}\``);
                chars = [c];
            } else {
                return message.reply('❌ Usage: `-بنك-أدمن حساب [@user or IBAN]`');
            }

            const SLOT_NAMES = { 1: 'Character 1', 2: 'Character 2', 3: 'Character 3' };
            const _img = await db.getImage('bank').catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle(`🏦 Accounts — ${mentioned ? mentioned.username : chars[0].character_name}`)
                .setColor(0x1565C0)
                .setFooter({ text: 'Bank Admin • FANTASY Bot' }).setTimestamp();

            for (const c of chars) {
                embed.addFields({
                    name: `${SLOT_NAMES[c.slot] || `Character ${c.slot}`} — ${c.character_name} ${c.family_name || ''}`,
                    value: `🏦 IBAN: \`${c.iban}\`\n💰 Balance: \`${Number(c.balance).toLocaleString()} Riyals\`\n${c.frozen ? '❄️ **Frozen**' : '✅ Active'}`,
                    inline: false,
                });
            }
            if (_img) embed.setImage(_img);
            return message.channel.send({ embeds: [embed] });
        }
    },
};
