const { GuildMember, EmbedBuilder, Colors } = require('discord.js');
const CharacterModel = require('../../database/schemas/character');
const StatCalculator = require('../Stats/StatCalculator');
const HealthVisuals = require('../Battle/HealthVisuals');
const HungerVisuals = require('../Hunting/HungerVisuals');
const Hunger = require('../Hunting/Hunger');
const stats = require('../Stats/stats.json');
const CoreUtil = require('../CoreUtil');
const STATS_BANNER = 'https://cdn.discordapp.com/attachments/955294038263750716/966906542609821696/IMG_8666.gif';

/**
 * @typedef {string} GuildId
 * @typedef {string} AllowedUserId
 * @type {Map<GuildId, Set<AllowedUserId>>} */
const usersAllowedToEdit = new Map();
const guildsAllowingAllToEdit = new Set();

/**
 * Format player stats.
 * @param {GuildMember} member
 * @param {CharacterModel} character 
 * @returns {EmbedBuilder[]}
 */
function formatStats(member, character) {
    const maxHealth = StatCalculator.calculateMaxHealth(character);
    const generalStats = EmbedBuilder.from({
        color: 0x680d2b,
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
                + HungerVisuals.getFlair(Hunger.getHunger(character) / Hunger.getMaxHunger(character)),
                value: `> ↣ \`${Hunger.getHunger(character)}\` / \`${Hunger.getMaxHunger(character)}\``,
                inline: true,
            },
            {
                name: 'Battle Power 💪',
                value: `> ↣ \`${StatCalculator.calculateBattlePower(character)}\` / \`${StatCalculator.max.battlePower}\``,
            }
        ]
    });

    let i = 0;
    const listedStats = EmbedBuilder.from({
        color: Colors.LuminousVividPink,
        image: { url: STATS_BANNER },
        fields: Object.keys(character.stats).map(stat => {
            return {
                name: stats[stat].flair + ' ' + stats[stat].name,
                value: `> ↣ \`${character.stats[stat]}\` / \`${stats[stat].max}\``,
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
    const generalStats = EmbedBuilder.from({
        color: 0x680d2b,
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
                value: `> ↣ \`${StatCalculator.calculateBattlePower(character)}\` / \`${StatCalculator.max.battlePower}\``,
            },
            {
                name: 'Attack',
                value: `> ↣ \`${StatCalculator.calculateAttackMax(character)}\` / \`${StatCalculator.max.attackMax}\``,
                inline: true,
            },
            {
                name: 'Dodge Chance',
                value: `> ↣ \`${StatCalculator.calculateDodgeChance(character)}\` / \`${StatCalculator.max.dodgeChance}\``,
                inline: true,
            },
            {
                name: 'Crit. Chance',
                value: `> ↣ \`${StatCalculator.min.critChance}\` - \`${StatCalculator.calculateCritChance(character)}\``,
                inline: true,
            },
        ]
    });
    
    return [generalStats];
}

const allowGuildEditing = (guildId) => guildsAllowingAllToEdit.add(guildId);
const disallowGuildEditing = (guildId) => guildsAllowingAllToEdit.delete(guildId);

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
 * Check to see if a user is allowed to edit their character stats in the current guild
 * @param {string} guildId 
 * @param {string} userId 
 * @returns {boolean} True if allowed | False if not
 */
const allowedToEdit = (guildId, userId) => {
    // return if guild does not require characters to be approved or edits are overriden
    const guildData = CoreUtil.Servers.cache.get(guildId);
    if (guildsAllowingAllToEdit.has(guildId)
    || (guildData && !guildData.characterApprovalRequired)) return true;

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
    allowGuildEditing,
    disallowGuildEditing,
}