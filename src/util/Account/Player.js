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
        .setImage('https://cdn.discordapp.com/attachments/958264733616705556/958265023308890132/86E85A9C-8C43-46AB-ABB2-78691EBBC17E.png')
        // .setThumbnail(interaction.guild.iconURL())
        .setThumbnail(interaction.member.avatarURL() || interaction.user.avatarURL())
        .setFields([
            {
                name: 'CURRENT HEALTH 💘',
                value: `> ↣ \`${userData.currentHealth}\` / \`${userData.stats.constitution * 5 + 50}\``,
                inline: true
            },
            {
                name: 'CURRENT HUNGER '
                + ['🍖', '🦴'][Math.floor((userData.currentHunger / userData.stats.cat_size)*2)],
                value: `> ↣ \`${userData.currentHunger}\` / \`${userData.stats.cat_size}\``,
                inline: true,
            },
            ...Object.keys(userData.stats).map(stat => {
                return {
                    name: stat.toUpperCase().replace('_', ' ') + ' ' + flairs[i],
                    value: `> ↣ \`${userData.stats[stat]}\` / \`${ranges[i++][1]}\``
                }
            })
        ])
        .setFooter(`⇸ CLAN AFFILITATION: ${userData.clan.toUpperCase()}`);
}

function calculateMaxHealth(constitution) {
    return constitution * 5 + 50;
}

module.exports = { formatStats, calculateMaxHealth };