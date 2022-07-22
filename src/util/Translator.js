/**
 * @deprecated
 */
class Translator {
    constructor(userId = null, fileId = null) {
        this.language = require('./Language').CachedLanguages.get(userId) || require('./Language').Languages.English;
        this.fileId = fileId;
    }

    /**
     * Get translation
     * @param {string} textId Requested text
     * @returns {string} Translation
     */
    get = (textId) => {
        if (!this.fileId) throw new Error('No fileId defined for the translator.');
        return require('./Language').get(this.language, this.fileId, textId);
    }

    /**
     * Get global translation
     * @param {string} textId Requested text
     * @returns {string} Translation
     */
    getGlobal = (textId) => {
        return require('./Language').getGlobal(this.language, textId);
    }

    /**
     * Get translation from a given object of translations
     * @param {object} object Object to pull a language from
     * @param {string} [key] Requested value
     * @returns 
     */
    getFromObject = (object, key = false) => {
        if (key)
            return object[key][this.language] ?? object[key]['en'] ?? object[0];
        
        return object[this.language] ?? object['en'] ?? object[0];
    }
}

module.exports = Translator;