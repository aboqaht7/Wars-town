const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

const resetButton = new ButtonBuilder().setCustomId('reset_menu').setLabel('🔄 Reset Menu').setStyle(ButtonStyle.Secondary);

const SYSTEMS = [
    { name: 'الهوية',        value: 'identity'    },
    { name: 'البنك',         value: 'bank'        },
    { name: 'الحقيبة',       value: 'bag'         },
    { name: 'الجوال',        value: 'phone'       },
    { name: 'سناب شات',      value: 'سناب شات'   },
    { name: 'الجرائم',       value: 'crime'       },
    { name: 'العقارات',      value: 'properties'  },
    { name: 'البلاك ماركت',  value: 'بلاك ماركت' },
    { name: 'الرحلات',       value: 'الرحلات'    },
    { name: 'الشرطة',        value: 'police'      },
    { name: 'الصحة',         value: 'health'      },
    { name: 'الوظائف',       value: 'jobs'        },
    { name: 'المحاماة',      value: 'law'         },
    { name: 'الإدارة',       value: 'admin'       },
    { name: 'السوق',         value: 'market'      },
    { name: 'المعدات',       value: 'معدات'       },
    { name: 'السوق المركزي', value: 'سوق-مركزي'  },
    { name: 'المحاماة',      value: 'محاماة'      },
    { name: 'العدل',         value: 'عدل'         },
    { name: 'المعرض',        value: 'showroom'    },
    { name: 'السيارات',      value: 'vehicles'    },
    { name: 'منصة X',        value: 'x_platform'  },
];

module.exports = {
    name: 'تعديل-صورة-امبيد',
    data: new SlashCommandBuilder()
        .setName('تعديل-صورة-امبيد')
        .setDescription('تعديل صورة إمبيد أي نظام')
        .addStringOption(o => o
            .setName('النظام')
            .setDescription('اختر النظام')
            .setRequired(true)
            .addChoices(...SYSTEMS)
        )
        .addStringOption(o => o
            .setName('الرابط')
            .setDescription('رابط الصورة المباشر (يجب أن ينتهي بـ .jpg أو .png ...)')
            .setRequired(true)
        ),

    async slashExecute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '❌ ليس لديك صلاحية.', flags: 64 });

        const system = interaction.options.getString('النظام');
        const url    = interaction.options.getString('الرابط').trim();

        if (!/^https?:\/\/.+/i.test(url))
            return interaction.reply({ content: '❌ الرابط يجب أن يبدأ بـ `https://`', flags: 64 });

        await db.setImage(system, url);

        const systemLabel = SYSTEMS.find(s => s.value === system)?.name || system;
        const embed = new EmbedBuilder()
            .setTitle(`✅ تم تحديث صورة ${systemLabel}`)
            .setColor(0x1B5E20)
            .setDescription(`تم حفظ الصورة الجديدة بنجاح.`)
            .setImage(url)
            .setFooter({ text: 'إدارة الصور • بوت FANTASY' })
            .setTimestamp();

        await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(resetButton)] });
        return interaction.reply({ content: '​', flags: 64 });
    },
};
