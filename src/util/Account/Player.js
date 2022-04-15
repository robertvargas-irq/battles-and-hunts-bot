const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const userSchema = require('../../database/schemas/user');
const {flairs, ranges} = require('./stats.json');

/**
 * Format player stats.
 * @param {BaseCommandInteraction} interaction 
 * @param {userSchema} userData 
 */
function formatStats(interaction, userData) {
    
    let i = 0;
    return new MessageEmbed()
        .setColor('LUMINOUS_VIVID_PINK')
        // .setTitle(interaction.member.displayName + ' Player Stats')
        .setAuthor({name: interaction.member.displayName + ' Player Stats', iconURL: interaction.guild.iconURL() })
        .setImage('https://media.discordapp.net/attachments/954246414987309076/964285751657390130/IMG_8456.png?width=960&height=540')
        .setThumbnail(interaction.member.displayAvatarURL())
        .setDescription('**- - - - -**')
        .setFields([
            {
                name: 'CURRENT HEALTH 💘',
                value: `> ↣ \`${userData.currentHealth}\` / \`${userData.stats.constitution * 5 + 50}\``,
                inline: true
            },
            {
                name: 'CURRENT HUNGER '
                + ['🍖', '🦴'][userData.currentHunger == userData.stats.cat_size ? 1 : 0],
                value: `> ↣ \`${userData.stats.cat_size - userData.currentHunger}\` / \`${userData.stats.cat_size}\``,
                inline: true,
            },
            ...Object.keys(userData.stats).map(stat => {
                return {
                    name: (i == 1 ? '- - - - -\n' : '') +
                        stat.toUpperCase().replace('_', ' ') + ' ' + flairs[i],
                    value: `> ↣ \`${userData.stats[stat]}\` / \`${ranges[i++][1]}\``
                }
            })
        ])
        .setFooter({text:`⇸ CLAN AFFILITATION: ${userData.clan.toUpperCase()}`});
}

function calculateMaxHealth(constitution) {
    return constitution * 5 + 50;
}

module.exports = { formatStats, calculateMaxHealth };