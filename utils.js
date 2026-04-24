const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function resetRow(key) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`reset_${key}`)
            .setLabel('Reset Menu')
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Secondary)
    );
}

function resetOption(key) {
    return { label: '🔄 Reset Menu', value: `reset_${key}`, description: 'Return to the main view' };
}

async function isAdmin(member, db) {
    if (member.permissions.has('Administrator')) return true;
    const progRoleId = await db.getConfig('programmer_role_id');
    if (progRoleId && member.roles.cache.has(progRoleId)) return true;
    return false;
}

module.exports = { resetRow, resetOption, isAdmin };
