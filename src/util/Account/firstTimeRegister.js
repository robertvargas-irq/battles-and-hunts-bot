const { BaseCommandInteraction } = require('discord.js');
const { default: mongoose } = require('mongoose');
const userSchema = require('../../database/schemas/user');
const collectCharacterStats = require('./collectCharacterStats');

/**
 * Get a user started on their first time using the battle bot!
 * @param {BaseCommandInteraction} interaction 
 */
async function firstTimeRegister(interaction) {

    // collect stats
    const stats = await collectCharacterStats(interaction,
        `Welcome to the Battle System for **${interaction.guild.name}**!\n` +
        `Let's get you squared away, **${interaction.member.displayName}**!\n` +
        `Please send your character's stats. (These can always be changed later using \`/edit\`!)`);
    if (!stats) return false; // error message already handled within collect()

    // register the user to the bot and return the user document
    const User = mongoose.model('User', userSchema);
    
    /**@type {mongoose.Document}*/
    const newUser = new User({
        userId: interaction.user.id,
        stats: stats,
        currentHealth: stats.constitution * 5 + 50
    });
    newUser.markModified('User.stats');
    return await newUser.save()
        .then(() => { return newUser })
        .catch(() => { return false });
    
}

module.exports = firstTimeRegister