const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function resetRow(key) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`reset_${key}`)
            .setLabel('🔄 Reset Menu')
            .setStyle(ButtonStyle.Secondary)
    );
}

module.exports = { resetRow };
