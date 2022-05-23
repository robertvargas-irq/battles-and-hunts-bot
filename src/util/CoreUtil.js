const FILE_LANG_ID = 'CORE_UTIL';

const { BaseCommandInteraction, MessageEmbed, MessagePayload } = require('discord.js');
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
     * Send a message and delete after a set amount of seconds
     * @param {BaseCommandInteraction} interaction 
     * @param {MessagePayload} messagePayload
     * @param {[number]} seconds
     */
    static async SendAndDelete(interaction, messagePayload, seconds = 20) {
        const translator = new Translator(interaction.user.id, FILE_LANG_ID);
        if (messagePayload.embeds[0].footer?.text) messagePayload.embeds[0].footer.text += '\n'
        + (
            interaction.ephemeral
            ? ''
            : '✨ ' + translator.get('CLEANLINESS_1') + ' ' + seconds + ' ' + translator.get('CLEANLINESS_2') + '!'
        )
        else messagePayload.embeds[0].setFooter({
            text: interaction.ephemeral
            ? ''
            : '✨ ' + translator.get('CLEANLINESS_1') + ' ' + seconds + ' ' + translator.get('CLEANLINESS_2') + '!'
        });

        // handle reply
        let promise;
        if (interaction.replied || interaction.deferred)
            promise = await interaction.editReply(messagePayload);
        else
            promise = await interaction.reply({
                ...messagePayload,
                ephemeral: true,
            });
        
        // delete if possible
        if (!interaction.ephemeral)
            setTimeout(() => interaction.deleteReply().catch(), seconds * 1000);
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

    
    /**
     * Prompts that time has run out.
     * @param {BaseCommandInteraction} interaction 
     * @param {Translator} translator
     */
    static InformTimeout(interaction, translator) {
        if (!translator) translator = new (require('./Translator'))();
        interaction.editReply({
            embeds: [ new MessageEmbed()
                .setColor('AQUA')
                .setTitle("⏰ " + translator.getGlobal('TIMEOUT'))
                .setDescription(translator.getGlobal('TIMEOUT_MESSAGE') + " ❣️"),
            ]
        });
        return false;
    }

    /**
     * Inform that input is invalid.
     * @param {BaseCommandInteraction} interaction 
     * @param {Translator} translator
     */
    static InformInvalid(interaction, translator) {
        if (!translator) translator = new require('./Translator')();
        interaction.editReply({
            embeds: [ new MessageEmbed()
                .setColor('AQUA')
                .setTitle("⚠️ " + translator.get('TOO_MANY_INVALID'))
                .setDescription(translator.get('TOO_MANY_INVALID_MESSAGE') + " ❣️"),
            ]
        });
        return false;
    }

    /**
     * Inform that they have not been assigned a clan yet.
     * @param {BaseCommandInteraction} interaction 
     * @param {Translator} translator
     */
    static InformNotRegistered(interaction, translator) {
        if (!translator) translator = new require('./Translator')();
        interaction.editReply({
            embeds: [ new MessageEmbed()
                .setColor('RED')
                .setTitle("⚠️ " + translator.get('NOT_REGISTERED'))
                .setDescription(translator.get('NOT_REGISTERED_MESSAGE') + " ❣️"),
            ]
        });
        return false;
    }

    /**
     * Show successful cancellation.
     * @param {BaseCommandInteraction} interaction 
     * @param {Translator} translator
     */
    static InformSuccessfulCancel(interaction, translator) {
        if (!translator) translator = new require('./Translator')();
        interaction.editReply({
            embeds: [ new MessageEmbed()
                .setColor('AQUA')
                .setTitle("✅ " + translator.getGlobal('SUCCESSFUL_CANCEL'))
                .setDescription(translator.getGlobal('MENU_DISMISS') + " ❣️"),
            ]
        });
        return false;
    }

    /**
     * Helper function; collects one input.
     * @param {BaseCommandInteraction} interaction
     */
    static async CollectOneMessage(interaction, filter) {
        let input = await interaction.channel.awaitMessages({ filter: filter, max: 1, time: TIME * 1000, errors: ['time'] })
            .then(collected => {
                let content = collected.first().content;
                collected.first().delete().catch(console.error);
                return content;
            })
            .catch(() => { return false });
        return input;
    }

}

module.exports = CoreUtil