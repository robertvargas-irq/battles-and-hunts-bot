const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const { calculateMaxHealth } = require('../../util/Account/Player');
const CoreUtil = require('../../util/CoreUtil');

module.exports = {
    name: 'health',
    description: 'Quickly view your health!',
    guilds: ['957854680367648778', '954037682223316992'],
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
                    .setColor(getColor(found.currentHealth, found.stats.constitution))
                    .setTitle(getTitle(found.currentHealth, found.stats.constitution))
                    .addField('CURRENT HEALTH ' + (found.currentHealth > 0 ? '💘' : '💔'), `> ↣ \`${found.currentHealth}\` / \`${calculateMaxHealth(found.stats.constitution)}\``),
            ]
        });
    
    },
};


// ! PLEASE FORGIVE ME MY BRAIN FRIED
const colors = [
    'AQUA',
    'YELLOW',
    'RED',
    'DARK_RED',
    'NOT_QUITE_BLACK'
];

const titles = [
    '🌿 Serene',
    '💫 A bit out of it',
    '❤️‍🩹 Hrrk...',
    '🩸 Help..',
    '🪦'
]

function getColor(health, constitution) {
    let maxHealth = calculateMaxHealth(constitution);

    if (health >= maxHealth / 4 * 3) return colors[0]
    else if (health > maxHealth / 2) return colors[1];
    else if (health > maxHealth / 4) return colors[2];
    else if (health > 0) return colors[3];
    else return colors[4];
}

function getTitle(health, constitution) {
    let maxHealth = calculateMaxHealth(constitution);

    if (health >= maxHealth / 4 * 3) return titles[0]
    else if (health > maxHealth / 2) return titles[1];
    else if (health > maxHealth / 4) return titles[2];
    else if (health > 0) return titles[3];
    else return titles[4];
}