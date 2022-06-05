const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const CoreUtil = require('../../util/CoreUtil');

module.exports = {
    name: 'hunger',
    description: 'Quickly view your hunger!',
    /**@param {BaseCommandInteraction} interaction */
    async execute( interaction ) {

        // defer
        await interaction.deferReply({ ephemeral: false });
        
        // if user is registered
        const found = await CoreUtil.FetchUser(interaction.user.id);
        if (!found) return CoreUtil.NotRegistered(interaction);

        // show health bar
        interaction.editReply({
            embeds: [
                new MessageEmbed()
                    .setColor(getColor(found.currentHunger, found.morph_size))
                    .setTitle(getTitle(found.currentHunger, found.morph_size))
                    .addField('CURRENT HUNGER ' + (found.currentHunger < found.morph_size ? '🍖' : '🦴'), `> ↣ \`${found.morph_size - found.currentHunger}\` / \`${found.morph_size}\``)
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

function getColor(hunger, morph_size) {
    if (hunger == 0) return colors[0];
    if (hunger == morph_size) return colors[3];
    if (hunger == morph_size - 1) return colors[2];
    return colors[1];
}

function getTitle(hunger, morph_size) {
    if (hunger == 0) return titles[0];
    if (hunger == morph_size) return titles[3];
    if (hunger == morph_size - 1) return titles[2];
    return titles[1];
}