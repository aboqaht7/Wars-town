const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
} = require('discord.js');
const { loadSystemBtns, makeBtn } = require('../btnConfig');
const { resetRow } = require('../utils');

module.exports = {
    name: 'cia',
    data: new SlashCommandBuilder()
        .setName('cia')
        .setDescription('CIA System — Login, Logout & Active Members'),
    async slashExecute(interaction, db) {
        const c = await loadSystemBtns(db, 'cia');

        const _img = await db.getImage('admin').catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('CIA — Intelligence Agency')
            .setColor(0x0D1B2A)
            .setDescription(
                '**🟢 Login** — Log your attendance as a CIA member\n' +
                '**🔴 Logout** — Log your departure\n' +
                '**👥 Active List** — View active CIA members (Chef only)\n' +
                '**🪪 Fake ID** — Issue a fake identity to someone (Chef only)\n\n' +
                '> Buttons available to CIA members only'
            )
            .setFooter({ text: 'CIA • FANTASY Bot' })
            .setTimestamp();

        const row1 = new ActionRowBuilder().addComponents(
            makeBtn('cia_login_btn',  c.login),
            makeBtn('cia_logout_btn', c.logout),
            makeBtn('cia_active_btn', c.active),
        );

        const row2 = new ActionRowBuilder().addComponents(
            makeBtn('cia_fake_id_btn', c.fake_id),
        );

        if (_img) embed.setImage(_img);

        const payload = { embeds: [embed], components: [row1, row2] };

        if (interaction._isReset) {
            return interaction.message.edit(payload);
        }
        await interaction.channel.send(payload);
        await interaction.reply({ content: '\u200b', flags: 64 });
    }
};
