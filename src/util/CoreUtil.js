const FILE_LANG_ID = 'CORE_UTIL';

const { BaseCommandInteraction, MessageEmbed, MessagePayload } = require('discord.js');
const mongoose = require('mongoose');
const userSchema = require('../database/schemas/user');
const serverSchema = require('../database/schemas/server');

const ServerModel = mongoose.model('Server', serverSchema);
const MemberModel = require('../database/schemas/member');
const UserModel = mongoose.model('User', userSchema);
const CharacterModel = require('../database/schemas/character');
const ExcuseModel = require('../database/schemas/excuse');
// const excuseModel = require('../database/schemas/excuse');


const ROLEPLAY_NAME = 'The Black Sun';

/**
 * Custom methods for myself because I am tired of rewriting them everywhere.
 */
class CoreUtil {

    static Assets = {
        preloader: 'https://cdn.discordapp.com/attachments/984351616033517598/984352125129723934/807.gif'
    }

    /**
     * Properly reply based on whether or not the interaction has been replied to already
     * @param {BaseCommandInteraction} interaction Interaction to reply to/edit reply
     * @param {MessagePayload} messagePayload The message to send
     */
    static async SafeReply(interaction, messagePayload) {
        if (interaction.replied) return interaction.editReply(messagePayload);
        return interaction.reply(messagePayload);
    }

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
        const translator = new (require('./Translator'))(interaction.user.id, FILE_LANG_ID);
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
     * @deprecated USE Users.FetchOne(userId, extraParameters)
     * @method Users.FetchOne
     * @param {string} userId Desired userId
     * @param {userSchema} extraParameters Any extra parameters to tighten the search
     * @returns {Promise<userSchema>}
     */
    static async FetchUser(userId, extraParameters = {}) {
        const User = mongoose.model('User', userSchema);
        return await User.findOne({ userId, ...extraParameters });
    }

    /**
     * Fetches all Users from the database
     * @deprecated USE Servers.FetchAll(extraParameters)
     * @method Users.FetchAll
     * @returns {Promise<{UserModel: mongoose.Model, users: userSchema[]}>}
     */
    static async FetchAllUsers() {
        const UserModel = mongoose.model('User', userSchema);
        return { UserModel, users: await UserModel.find() };
    }

    /**
     * Fetch a User from the database
     * @deprecated USE Servers.FetchOne(guildId, extraParameters)
     * @method Servers.FetchOne
     * @param {string} guildId
     * @param {serverSchema} extraParameters Any extra parameters to tighten the search
     * @returns {Promise<serverSchema>}
     */
    static async FetchServer(guildId, extraParameters = {}) {
        const Server = mongoose.model('Server', serverSchema);
        return await (await Server.findOne({ guildId, ...extraParameters }) || await Server.create({ guildId }));
    }

    /** Fetch from the Members category of the database */
    static Members = {
        cache: require('./Member/MemberCache').cache,
        /**
         * Fetch one Member of a given Guild from the database
         * @param {string} guildId Desired guild id
         * @param {string} userId Desired user id
         * @param {MemberModel} extraParameters Any extra parameters to tighten the search
         * @returns {Promise<MemberModel>}
         */
        FetchOne: async (guildId, userId, extraParameters = {}) => {
            const query = { guildId, userId, ...extraParameters };
            return await (await MemberModel.findOne(query)) || await MemberModel.create(query);
        },
        /**
         * Fetch all Members of a given Guild from the database
         * @param {string} guildId Desired guild id
         * @param {MemberModel} extraParameters Any extra parameters to tighten the search
         * @returns {Promise<MemberModel[]>}
         */
        FetchAll: async (guildId, extraParameters = {}) => {
            const query = { guildId, ...extraParameters };
            return await MemberModel.find(query);
        },
        /**
         * Fetch all Members regardless of guild association from the database
         * @param {MemberModel} extraParameters Any extra parameters to tighten the search
         * @returns {Promise<MemberModel[]>}
         */
        FetchAllGuildless: async (extraParameters = {}) => {
            return await MemberModel.find(extraParameters);
        }
    }

    /** Fetch from the Users category of the database */
    static Users = {
        /**
         * Fetch one User from the database
         * @param {string} userId Desired user id
         * @param {userSchema} extraParameters Any extra parameters to tighten the search
         * @returns {Promise<UserModel>}
         */
        FetchOne: async (userId, extraParameters = {}) => {
            const query = { userId, ...extraParameters };
            return await (await UserModel.findOne(query)) || await UserModel.create(query);
        },
        /**
         * Fetch all Users from the database
         * @param {userSchema} extraParameters Any extra parameters to tighten the search
         * @returns {Promise<UserModel[]>}
         */
        FetchAll: async (extraParameters = {}) => {
            return await UserModel.find(extraParameters);
        }
    }

    static Characters = {
        cache: require('./Character/CharacterCache').cache,
        /**
         * Fetch one Character of a given Guild from the database
         * @param {string} guildId Desired guild id
         * @param {string} userId Desired user id
         * @param {CharacterModel} extraParameters Any extra parameters to tighten the search
         * @returns {Promise<CharacterModel>}
         */
        FetchOne: async (guildId, userId, extraParameters = {}) => {
            const query = { guildId, userId, ...extraParameters };
            return await (await CharacterModel.findOne(query)) || await CharacterModel.create(query);
        },
        /**
         * Fetch all Characters of a given Guild from the database
         * @param {string} guildId Desired guild to fetch from
         * @param {CharacterModel} extraParameters Any extra parameters to tighten the search
         * @returns {Promise<CharacterModel[]>}
         */
        FetchAll: async (guildId, extraParameters = {}) => {
            const query = { guildId, ...extraParameters };
            return await CharacterModel.find(query);
        },
        /**
         * Fetch all Characters regardless of guild association from the database
         * @param {CharacterModel} extraParameters Any extra parameters to tighten the search
         * @returns {Promise<CharacterModel[]>}
         */
        FetchAllGuildless: async (extraParameters = {}) => {
            return await CharacterModel.find(extraParameters);
        }
    }

    /** Fetch from the Servers category of the database */
    static Servers = {
        cache: require('./Server/ServerCache').cache,
        FetchOne: async (guildId, extraParameters = {}) => {
            const query = { guildId, ...extraParameters };
            return await (await ServerModel.findOne(query)) || await ServerModel.create(query);
        },
        FetchAll: async (extraParameters = {}) => {
            return await ServerModel.find(extraParameters);
        }
    }

    static Excuses = {
        cache: require('./Excused/ExcuseCache').cache,
        FetchOne: async (guildId, userId, day, type, extraParameters = {}) => {
            return await ExcuseModel.findOne({ guildId, userId, day, type, ...extraParameters });
        },
        FetchAllFromUser: async (guildId, userId, extraParameters = {}) => {
            return await ExcuseModel.find({ guildId, userId, ...extraParameters });
        },
        FetchAllFromServer: async (guildId, extraParameters = {}) => {
            return await ExcuseModel.find({ guildId, ...extraParameters });
        },
        FetchAllGuildless: async (extraParameters = {}) => {
            return await ExcuseModel.find(extraParameters);
        }
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
        if (!translator) translator = new (require('./Translator'))();
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
        if (!translator) translator = new (require('./Translator'))();
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
        if (!translator) translator = new (require('./Translator'))();
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