const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const userSchema = require('../database/schemas/user');
const serverSchema = require('../database/schemas/server');
const ROLEPLAY_NAME = 'The Black Sun';

/**
 * Custom methods for myself because I am tired of rewriting them everywhere.
 */
class CoreUtil {

    /**
     * Inform the user that they have not registered and must do so.
     * @param {BaseCommandInteraction} interaction
     */
    static async NotRegistered(interaction) {
        const reply = {
            embeds: [new MessageEmbed({
                color: 'RED',
                title: '⚠️ Woah there!',
                description: 'You haven\'t signed up for the bot yet!'
                + '\nBefore you can start using any of the nifty features, **you must first `/register` with your OC\'s details!**'
                + '\nThis is also required for roleplay sessions within `' + ROLEPLAY_NAME + '`!'
                + '\nIt only takes a few seconds, and all you need is your cat\'s `morph size` and `stat sheet`!'
                + '\n\n__SideNote__: *If you haven\'t submitted a character form and had it approved, that is required before signing up!*',
                footer: {
                    text: interaction.ephemeral
                    ? '🧹 You may now dismiss this menu'
                    : '✨ For cleanliness, this message will self-destruct in 20 seconds!'
                }
            })]
        }

        // handle reply
        let promise;
        if (interaction.replied || interaction.deferred)
            promise = await interaction.editReply(reply);
        else
            promise = await interaction.reply({
                ...reply,
                ephemeral: true,
            });
        
        // delete if possible
        if (!interaction.ephemeral)
            setTimeout(() => interaction.deleteReply().catch(), 20 * 1000);
    }

    /**
     * Fetch a User from the database
     * @param {string} userId Desired userId
     * @param {userSchema} extraParameters Any extra parameters to tighten the search
     * @returns {Promise<userSchema>}
     */
    static async FetchUser(userId, extraParameters = {}) {
        const User = mongoose.model('User', userSchema);
        return await User.findOne({ userId, ...extraParameters });
    }

    /**
     * Fetch a User from the database
     * @param {string} guildId
     * @param {serverSchema} extraParameters Any extra parameters to tighten the search
     * @returns {Promise<serverSchema>}
     */
    static async FetchServer(guildId, extraParameters = {}) {
        const Server = mongoose.model('Server', serverSchema);
        return await (await Server.findOne({ guildId, ...extraParameters }) || await Server.create({ guildId }));
    }

    /**
     * Fetches all Users from the database
     * @returns {Promise<{UserModel: mongoose.Model, users: userSchema[]}>}
     */
    static async FetchAllUsers() {
        const UserModel = mongoose.model('User', userSchema);
        return { UserModel, users: await UserModel.find() };
    }

}

module.exports = CoreUtil