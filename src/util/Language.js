const userSchema = require('../database/schemas/user');
const translations = require('./translations.json');

class Language {

    /**
     * Type Definitions
     * @typedef {'en'|'es'|'pr'|'pol'} LanguageType
     */

    static Languages = {
        English:'en',
        Spanish:'es',
        Portuguese:'pr',
        Polish:'pol',
        German: 'de',
    };

    /**
     * All language preferences cached to the bot
     * @typedef {Map<string, string>} CachedLanguages
     * @type {CachedLanguages}
     */
    static CachedLanguages = new Map();

    /**
     * Load all user languages into cache
     * @returns {Promise<CachedLanguages>} Cached languages
     */
    static LoadLanguages = async () => {
        const users = await require('./CoreUtil').Users.FetchAll();
        for (const user of users) {
            this.CachedLanguages.set(user.userId, user.preferredLanguage);
        }

        return this.CachedLanguages;
    }

    /**
     * Cache language change
     * @param {userSchema} userModel
     */
    static SetLanguage = (userModel) => {
        this.CachedLanguages.set(userModel.userId, userModel.preferredLanguage);
    }

    /**
     * Get translation for the file
     * @param {string} language
     * @param {string} fileId 
     * @param {string} textId 
     * @returns {string} Translation
     */
    static get = (language, fileId, textId) => {
        if (!translations[fileId])
            throw new Error(`File ID (${fileId}) does not exist.`)
        if (!translations[fileId][textId])
            throw new Error(`Text ID (${textId}) does not exist in File ID (${fileId})`);
        
        return translations[fileId][textId][language] ?? translations[fileId][textId].en;
    }

    /**
     * Get translation from globals
     * @param {string} language
     * @param {string} textId 
     * @returns {string} Translation
     */
    static getGlobal = (language, textId) => {
        if (!translations.GLOBAL[textId])
            throw new Error(`Text ID (${textId}) does not exist in translation globals.`);
        
        return translations.GLOBAL[textId][language] ?? translations.GLOBAL[textId].en;
    }


}

module.exports = Language;