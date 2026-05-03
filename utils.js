const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * إنشاء (أو إعادة استخدام) رتبة "Owner [name]" وإسنادها للعضو.
 * - إذا وُجدت رتبة بنفس الاسم في السيرفر: تُستعمل بدل إنشاء جديدة.
 * - تعود مع `role.id` أو `null` عند الفشل (صلاحيات/خطأ شبكة).
 */
async function ensureOwnerRole(guild, member, name) {
    if (!guild || !member || !name) return null;
    try {
        const safeName = String(name).slice(0, 80);
        const roleName = `Owner ${safeName}`;
        let role = guild.roles.cache.find(r => r.name === roleName);
        if (!role) {
            role = await guild.roles.create({
                name: roleName,
                color: 0xE53935,
                reason: `Ownership role for ${member.user?.tag || member.id}`,
                mentionable: false,
            });
        }
        if (!member.roles.cache.has(role.id)) {
            await member.roles.add(role).catch(() => {});
        }
        return role.id;
    } catch (e) {
        console.error('[ensureOwnerRole] failed:', e?.message);
        return null;
    }
}

async function deleteOwnerRole(guild, roleId) {
    if (!guild || !roleId) return;
    try {
        const role = guild.roles.cache.get(roleId) || await guild.roles.fetch(roleId).catch(() => null);
        if (role) await role.delete('Ownership ended').catch(() => {});
    } catch (_) {}
}


function resetRow(key) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`reset_${key}`)
            .setLabel('Reset Menu')
            .setEmoji({ id: '1479212270746599528', name: 'GL137', animated: true })
            .setStyle(ButtonStyle.Secondary)
    );
}

function resetOption(key) {
    return { label: 'Reset Menu', value: `reset_${key}`, description: 'Return to the main view', emoji: { id: '1479212270746599528', name: 'GL137', animated: true } };
}

async function isAdmin(member, db) {
    if (member.permissions.has('Administrator')) return true;
    const progRoleId = await db.getConfig('programmer_role_id');
    if (progRoleId && member.roles.cache.has(progRoleId)) return true;
    return false;
}

module.exports = { resetRow, resetOption, isAdmin, ensureOwnerRole, deleteOwnerRole };
