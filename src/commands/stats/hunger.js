const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const userSchema = require('../../database/schemas/user');
const firstTimeRegister = require('../../util/Account/firstTimeRegister');

module.exports = {
    name: 'hunger',
    description: 'Quickly view your hunger!',
    guilds: ['957854680367648778', '954037682223316992'],
    /**@param {BaseCommandInteraction} interaction */
    async execute( interaction ) {

        // defer
        await interaction.deferReply({ ephemeral: false });
        
        // if user is registered
        const User = mongoose.model('User', userSchema);
        /**@type {mongoose.Document}*/ let found = await User.findOne({ userId: interaction.user.id }).exec();

        // prompt registration if user is not registered; inform if registered
        if (!found) found = await firstTimeRegister(interaction);
        if (!found) return; // error has already been handled inside collect()

        // show health bar
        interaction.editReply({
            embeds: [
                new MessageEmbed()
                    .setColor(getColor(found.currentHunger, found.stats.cat_size))
                    .setTitle(getTitle(found.currentHunger, found.stats.cat_size))
                    .addField('CURRENT HUNGER ' + (found.currentHunger < found.stats.cat_size ? '🍖' : '🦴'), `> ↣ \`${found.stats.cat_size - found.currentHunger}\` / \`${found.stats.cat_size}\``),
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