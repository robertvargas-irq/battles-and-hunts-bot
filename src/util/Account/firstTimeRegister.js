const FILE_LANG_ID = 'FIRST_TIME_REGISTER';

const { BaseCommandInteraction } = require('discord.js');
const { default: mongoose } = require('mongoose');
const userSchema = require('../../database/schemas/user');
const Translator = require('../Translator');
const collectCharacterStats = require('./collectCharacterStats');

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
    const User = mongoose.model('User', userSchema);
    
    /**@type {mongoose.Document}*/
    const newUser = new User({
        userId: interaction.user.id,
        stats: stats,
        currentHealth: stats.constitution * 5 + 50,
        currentHunger: 0,
        clan: clanRole,
    });
    newUser.markModified('User.stats');
    return await newUser.save()
        .then(() => { return newUser })
        .catch(() => { return false });
    
}

module.exports = firstTimeRegister