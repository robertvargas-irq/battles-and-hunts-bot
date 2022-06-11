const FILE_LANG_ID = 'FIRST_TIME_REGISTER';

const { BaseCommandInteraction } = require('discord.js');
const { default: mongoose } = require('mongoose');
const Translator = require('../Translator');
const Player = require('./Player');
const collectCharacterStats = require('./collectCharacterStats');
const CharacterModel = require('../../database/schemas/character');

/**
 * Get a user started on their first time using the battle bot!
 * @param {BaseCommandInteraction} interaction 
 */
async function firstTimeRegister(interaction) {

    const translator = new Translator(interaction.user.id, FILE_LANG_ID);

    // collect stats
    const {clanRole, stats} = await collectCharacterStats(interaction, translator.get('PROMPT').replace('{{name}}', interaction.guild.name));
    if (!stats) return false; // error message already handled within collect()

    // register the user to the bot and return the user document
    return await CharacterModel.create({
        guildId: interaction.guild.id,
        userId: interaction.user.id,
        stats,
        currentHealth: Player.calculateMaxHealth(stats.constitution),
        currentHunger: 0,
        clan: clanRole,
    }).catch(() => false);
    
}

module.exports = firstTimeRegister