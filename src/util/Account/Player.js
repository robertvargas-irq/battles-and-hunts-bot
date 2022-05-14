const FILE_LANG_ID = 'PLAYER';

const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const userSchema = require('../../database/schemas/user');
const Translator = require('../Translator');
const {ranges, flairs, name_translations} = require('./stats.json');
const STATS_BANNER = 'https://media.discordapp.net/attachments/954246414987309076/964285751657390130/IMG_8456.png?width=960&height=540';

/**
 * Format player stats.
 * @param {BaseCommandInteraction} interaction 
 * @param {userSchema} userData 
 * @param {string} originalCallerId For translation purposes
 */
function formatStats(interaction, userData, originalCallerId) {

    const translator = new Translator(originalCallerId, FILE_LANG_ID);
    
    let i = 0;
    return new MessageEmbed()
        .setColor('LUMINOUS_VIVID_PINK')
        .setAuthor({
            name: interaction.member.displayName + ' ' + translator.get('STATS_HEADER'),
            iconURL: interaction.guild.iconURL()
        })
        .setImage(STATS_BANNER)
        .setThumbnail(interaction.member.displayAvatarURL())
        .setDescription('**- - - - -**')
        .setFields([
            {
                name: translator.getGlobal('CURRENT_HEALTH') + ' 💘',
                value: `> ↣ \`${userData.currentHealth}\` / \`${userData.stats.constitution * 5 + 50}\``,
                inline: true
            },
            {
                name: translator.getGlobal('CURRENT_HUNGER') + ' '
                + ['🍖', '🦴'][userData.currentHunger == userData.stats.cat_size ? 1 : 0],
                value: `> ↣ \`${userData.stats.cat_size - userData.currentHunger}\` / \`${userData.stats.cat_size}\``,
                inline: true,
            },
            ...Object.keys(userData.stats).map(stat => {
                return {
                    name: (i == 1 ? '- - - - -\n' : '') +
                        translator.getFromObject(name_translations[i]).toUpperCase() + ' ' + flairs[i],
                    value: `> ↣ \`${userData.stats[stat]}\` / \`${ranges[i++][1]}\``
                }
            })
        ])
        .setFooter({text:'⇸ ' + translator.get('CLAN_AFFILIATION') + `: ${userData.clan.toUpperCase()}`});
}

function calculateMaxHealth(constitution) {
    return constitution * 5 + 50;
}

module.exports = { formatStats, calculateMaxHealth };