const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('Reset Menu').setEmoji({ id: '1479212270746599528', name: 'GL137', animated: true }).setStyle(ButtonStyle.Secondary);

const SYSTEMS = [
    { name: 'Identity — الهوية',                value: 'identity'      },
    { name: 'Bank — البنك',                     value: 'bank'          },
    { name: 'Bag — الحقيبة',                    value: 'bag'           },
    { name: 'Phone — الجوال',                   value: 'phone'         },
    { name: 'Snapchat — سناب شات',              value: 'Snapchat'      },
    { name: 'Crimes — الجرائم',                 value: 'crime'         },
    { name: 'Properties — العقارات',            value: 'properties'    },
    { name: 'Black Market — السوق السوداء',     value: 'بلاك ماركت'    },
    { name: 'Trips — الرحلات',                  value: 'الرحلات'       },
    { name: 'Events / Flight — الأحداث',        value: 'events'        },
    { name: 'Health — الصحة',                   value: 'health'        },
    { name: 'Jobs — الوظائف',                   value: 'jobs'          },
    { name: 'Law — مكتب المحاماة',              value: 'law'           },
    { name: 'Lawyers — المحامون',               value: 'محاماة'        },
    { name: 'Justice / Judges — العدالة',       value: 'عدل'           },
    { name: 'Admin / Police — الإدارة',         value: 'admin'         },
    { name: 'Store / Market — السوق',           value: 'market'        },
    { name: 'Equipment — المعدات',              value: 'معدات'         },
    { name: 'Central Market — السوق المركزي',   value: 'سوق-مركزي'    },
    { name: 'Showroom — معرض السيارات',         value: 'showroom'      },
    { name: 'Vehicles — السيارات',              value: 'vehicles'      },
    { name: 'X Platform — منصة X',              value: 'x_platform'    },
    { name: 'Tickets — التكتات',                value: 'tickets'       },
    { name: 'Citizen File — ملف المواطن',       value: 'citizen_file'  },
    { name: 'Admin Points — نقاط الإدارة',      value: 'نقاط-الادارة' },
    { name: 'CIA — الاستخبارات',                value: 'cia'           },
    { name: 'Help — قائمة المساعدة',            value: 'help'          },
    { name: 'Stock Market — سوق الأسهم',        value: 'سوق-الاسهم'   },
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
            .setAutocomplete(true)
        )
        .addStringOption(o => o
            .setName('الرابط')
            .setDescription('Direct image URL (must end with .jpg, .png, etc.)')
            .setRequired(true)
        ),

    async autocomplete(interaction) {
        const focused = (interaction.options.getFocused() || '').toLowerCase();
        const choices = SYSTEMS
            .filter(s => !focused
                || s.name.toLowerCase().includes(focused)
                || s.value.toLowerCase().includes(focused))
            .slice(0, 25)
            .map(s => ({ name: s.name, value: s.value }));
        return interaction.respond(choices);
    },

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
            .setColor(0xE53935)
            .setDescription('New image saved successfully.')
            .setImage(url)
            .setFooter({ text: 'Image Management • FANTASY Bot' })
            .setTimestamp();

        await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetButton)] });
        return interaction.reply({ content: '​', flags: 64 });
    },
};
