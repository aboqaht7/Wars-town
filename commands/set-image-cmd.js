const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('Reset Menu').setEmoji({ id: '1479212270746599528', name: 'GL137', animated: true }).setStyle(ButtonStyle.Secondary);

const SYSTEMS = [
    { name: 'Identity',        value: 'identity'    },
    { name: 'Bank',            value: 'bank'        },
    { name: 'Bag',             value: 'bag'         },
    { name: 'Phone',           value: 'phone'       },
    { name: 'Snapchat',        value: 'Snapchat'    },
    { name: 'Crimes',          value: 'crime'       },
    { name: 'Properties',      value: 'properties'  },
    { name: 'Black Market',    value: 'بلاك ماركت'  },
    { name: 'Trips',           value: 'الرحلات'     },
    { name: 'Police',          value: 'police'      },
    { name: 'Health',          value: 'health'      },
    { name: 'Jobs',            value: 'jobs'        },
    { name: 'Law',             value: 'law'         },
    { name: 'Admin',           value: 'admin'       },
    { name: 'Store',           value: 'market'      },
    { name: 'Equipment',       value: 'معدات'       },
    { name: 'Central Market',  value: 'سوق-مركزي'  },
    { name: 'Lawyers',         value: 'محاماة'      },
    { name: 'Justice',         value: 'عدل'         },
    { name: 'Showroom',        value: 'showroom'    },
    { name: 'Vehicles',        value: 'vehicles'    },
    { name: 'X Platform',      value: 'x_platform'  },
];

module.exports = {
    name: 'تعديل-صورة-امبيد',
    data: new SlashCommandBuilder()
        .setName('تعديل-صورة-امبيد')
        .setDescription('Update the embed image for any system')
        .addStringOption(o => o
            .setName('النظام')
            .setDescription('Choose the system')
            .setRequired(true)
            .addChoices(...SYSTEMS)
        )
        .addStringOption(o => o
            .setName('الرابط')
            .setDescription('Direct image URL (must end with .jpg, .png, etc.)')
            .setRequired(true)
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ You do not have permission.', flags: 64 });

        const system = interaction.options.getString('النظام');
        const url    = interaction.options.getString('الرابط').trim();

        if (!/^https?:\/\/.+/i.test(url))
            return interaction.reply({ content: '❌ URL must start with `https://`', flags: 64 });

        await db.setImage(system, url);

        const systemLabel = SYSTEMS.find(s => s.value === system)?.name || system;
        const embed = new EmbedBuilder()
            .setTitle(`✅ Image Updated — ${systemLabel}`)
            .setColor(0x1B5E20)
            .setDescription('New image saved successfully.')
            .setImage(url)
            .setFooter({ text: 'Image Management • FANTASY Bot' })
            .setTimestamp();

        await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetButton)] });
        return interaction.reply({ content: '​', flags: 64 });
    },
};
