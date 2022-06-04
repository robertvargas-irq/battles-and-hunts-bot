const FILE_LANG_ID = 'PLAYER';

const { GuildMember, MessageEmbed } = require('discord.js');
const userSchema = require('../../database/schemas/user');
const Translator = require('../Translator');
const {ranges, flairs, name_translations} = require('./stats.json');
const STATS_BANNER = 'https://media.discordapp.net/attachments/954246414987309076/964285751657390130/IMG_8456.png?width=960&height=540';

/**
 * @typedef {string} GuildId
 * @typedef {string} AllowedUserId
 * @type {Map<GuildId, Set<AllowedUserId>>} */
const usersAllowedToEdit = new Map();

/**
 * Format player stats.
 * @param {GuildMember} member
 * @param {userSchema} userData 
 * @param {string} originalCallerId For translation purposes
 */
function formatStats(member, userData, originalCallerId) {

    const translator = new Translator(originalCallerId, FILE_LANG_ID);
    
    let i = 0;
    return new MessageEmbed()
        .setColor('LUMINOUS_VIVID_PINK')
        .setAuthor({
            name: member.displayName + ' ' + translator.get('STATS_HEADER'),
            iconURL: member.guild.iconURL()
        })
        .setImage(STATS_BANNER)
        .setThumbnail(member.displayAvatarURL())
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

const allowEditing = (guildId, userId) => {
    // create set if not already done
    if (!usersAllowedToEdit.has(guildId)) usersAllowedToEdit.set(guildId, new Set())

    // add to editing list
    return usersAllowedToEdit.get(guildId).add(userId);
}

/**
 * Re-lock editing for all users by clearing all permissions
 * @param {string} guildId Guild to clear
 */
const clearEditing = (guildId) => {
    // create set if not already done and return
    if (!usersAllowedToEdit.has(guildId)) return usersAllowedToEdit.set(guildId, new Set());

    // clear editing list for the guild
    usersAllowedToEdit.get(guildId).clear();
}

/**
 * Check to see if a user is allowed to /edit in the current guild
 * @param {string} guildId 
 * @param {string} userId 
 * @returns {boolean} True if allowed | False if not
 */
const allowedToEdit = (guildId, userId) => {
    const guild = usersAllowedToEdit.get(guildId);
    return guild && guild.has(userId);
}

/**
 * Calculate a user's max health from their constitution
 * @param {number} constitution 
 * @returns {number} Max health
 */
function calculateMaxHealth(constitution) {
    return constitution * 5 + 50;
}

module.exports = { formatStats, calculateMaxHealth, allowEditing, clearEditing, allowedToEdit };