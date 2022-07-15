const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const CoreUtil = require('../../util/CoreUtil');

module.exports = {
    name: 'hunger',
    description: 'Quickly view your hunger!',
    /**@param {BaseCommandInteraction} interaction */
    async execute( interaction ) {
        
        // if user is registered
        const found = CoreUtil.Characters.cache.get(interaction.guild.id, interaction.user.id);
        if (!found || !found.approved) return CoreUtil.NotRegistered(interaction);

        // show health bar
        interaction.reply({
            embeds: [
                new MessageEmbed()
                    .setColor(getColor(found.currentHunger, found.stats.cat_size))
                    .setTitle(getTitle(found.currentHunger, found.stats.cat_size))
                    .setFields([
                        {
                            name: 'CURRENT HUNGER ' + (found.currentHunger < found.stats.cat_size ? '🍖' : '🦴'),
                            value: `> ↣ \`${found.stats.cat_size - found.currentHunger}\` / \`${found.stats.cat_size}\``
                        },
                        {
                            name: 'Last Ate At',
                            value: '> ' + (found.lastAteAt > 0 ? '<t:' + found.lastAteAt + '>, roughly <t:' + found.lastAteAt + ':R>' : 'Hmm... can\'t remember...'),
                        },
                    ])
                    .setFooter({ text: '🍃 This hunger stat is canon.' }),
            ]
        });
    
    },
};


// ! PLEASE FORGIVE ME MY BRAIN FRIED
const colors = [
    'AQUA',
    'YELLOW',
    'RED',
    'NOT_QUITE_BLACK'
];

const titles = [
    '🍖 Satiated',
    '🍴 Could go for a bite',
    '⏳ Not feeling too good...',
    '🦴 I might starve soon...'
]

function getColor(hunger, cat_size) {
    if (hunger == 0) return colors[0];
    if (hunger == cat_size) return colors[3];
    if (hunger == cat_size - 1) return colors[2];
    return colors[1];
}

function getTitle(hunger, cat_size) {
    if (hunger == 0) return titles[0];
    if (hunger == cat_size) return titles[3];
    if (hunger == cat_size - 1) return titles[2];
    return titles[1];
}