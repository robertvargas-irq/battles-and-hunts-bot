const { GuildMember, MessageEmbed } = require('discord.js');
const CharacterModel = require('../../database/schemas/character');
const stats = require('../CharacterMenu/stats.json');
const StatCalculator = require('../Stats/StatCalculator');
const HealthVisuals = require('../Battle/HealthVisuals');
const HungerVisuals = require('../Hunting/HungerVisuals');
const STATS_BANNER = 'https://cdn.discordapp.com/attachments/955294038263750716/966906542609821696/IMG_8666.gif';

/**
 * @typedef {string} GuildId
 * @typedef {string} AllowedUserId
 * @type {Map<GuildId, Set<AllowedUserId>>} */
const usersAllowedToEdit = new Map();

/**
 * Format player stats.
 * @param {GuildMember} member
 * @param {CharacterModel} character 
 * @returns {MessageEmbed[]}
 */
function formatStats(member, character) {
    const maxHealth = StatCalculator.calculateMaxHealth(character);
    const generalStats = new MessageEmbed({
        color: '680d2b',
        title: (character.name ?? member.displayName + '\'s Character') + ' General Stats',
        thumbnail: { url: character.icon ?? member.displayAvatarURL({ dynamic: true }) },
        fields: [
            {
                name: 'Current Health '
                + HealthVisuals.getFlair(character.currentHealth / maxHealth),
                value: `> ↣ \`${character.currentHealth}\` / \`${maxHealth}\``,
                inline: true
            },
            {
                name: 'Current Hunger '
                + HungerVisuals.getFlair(1 - character.currentHunger / character.stats.cat_size),
                value: `> ↣ \`${character.stats.cat_size - character.currentHunger}\` / \`${character.stats.cat_size}\``,
                inline: true,
            },
            {
                name: 'Battle Power 💪',
                value: `> ↣ \`${StatCalculator.calculateBattlePower(character)}\` / \`40\``,
            }
        ]
    });

    let i = 0;
    const listedStats = new MessageEmbed({
        color: 'LUMINOUS_VIVID_PINK',
        image: { url: STATS_BANNER },
        fields: Object.keys(character.stats).map(stat => {
            return {
                name: stats[stat].flair + ' ' + stats[stat].name,
                value: `> ↣ \`${character.stats[stat]}\` / \`${stats[stat].range[1]}\``,
                inline: true,
            }
        }),
        footer: {
            text:'⇸ Clan Affiliation: ' + character.clan?.toUpperCase() || 'NONE',
            iconURL: member.guild.iconURL(),
        },
    });
    return [generalStats, listedStats];
}

/**
 * Format player's battle stats.
 * @param {GuildMember} member
 * @param {CharacterModel} character 
 */
 function formatBattleStats(member, character) {
    const maxHealth = StatCalculator.calculateMaxHealth(character);
    const generalStats = new MessageEmbed({
        color: '680d2b',
        title: (character.name ?? member.displayName + '\'s Character') + ' Battle Stats',
        thumbnail: { url: character.icon ?? member.displayAvatarURL({ dynamic: true }) },
        fields: [
            {
                name: 'Current Health '
                + HealthVisuals.getFlair(character.currentHealth / maxHealth),
                value: `> ↣ \`${character.currentHealth}\` / \`${maxHealth}\``,
                inline: true
            },
            {
                name: 'Battle Power 💪',
                value: `> ↣ \`${StatCalculator.calculateBattlePower(character)}\` / \`30\``,
            },
            {
                name: 'Attack',
                value: `> ↣ \`${StatCalculator.calculateAttackMax(character)}\` / \`40\``,
                inline: true,
            },
            {
                name: 'Dodge Chance',
                value: `> ↣ \`${StatCalculator.calculateDodgeChance(character)}\` / \`40\``,
                inline: true,
            },
            {
                name: 'Crit. Chance',
                value: `> ↣ \`0\` - \`${StatCalculator.calculateCritChance(character)}\``,
                inline: true,
            },
        ]
    });
    
    return [generalStats];
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

module.exports = {
    usersAllowedToEdit,
    formatStats,
    formatBattleStats,
    allowEditing,
    clearEditing,
    allowedToEdit,
}