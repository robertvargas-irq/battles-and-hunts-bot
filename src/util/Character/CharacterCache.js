const CharacterModel = require('../../database/schemas/character');

/**
 * @typedef {Map<guildId, Map<userId, CharacterModel>>} CharacterCacheMap
 * @type {CharacterCacheMap} */
const cached = new Map();

class CharacterCache {

    /**
     * Cache all character documents from the database
     * @returns {CharacterCache}
     */
    static async CacheCharacters() {
        const characters = await require('../CoreUtil').Characters.FetchAllGuildless();
        for (const character of characters) {
            // initiate guild cache if not already created then assign the character to the cache
            if (!cached.has(character.guildId))
                cached.set(character.guildId, new Map());
            cached.get(character.guildId).set(character.userId, character);
        }

        return cached;
    }

    /** Cache for all Characters */
    static cache = {
        /**
         * Get one cached Character from a guild
         * @param {string} guildId Requested guild id
         * @param {string} userId Requested user id
         * @returns {CharacterModel}
         */
        get(guildId, userId) {
            // handle non-existent guild
            if (!cached.has(guildId)) cached.set(guildId, new Map());
            
            let character = cached.get(guildId).get(userId);
            if (!character) character = new CharacterModel({ guildId, userId });
            
            return character;
        },
        /**
         * Get all cached Characters from a guild
         * @param {string} guildId Requested guild id
         * @returns {Map<userId: string, CharacterModel>}
         */
        getAll(guildId) {
            return cached.get(guildId);
        },
        /**
         * Get all cached Characters regardless of guild
         * @returns {CharacterCache}
         */
        getAllGuildless() {
            return cached;
        },
        /**
         * Cache a mongoose document
         * @param {string} guildId 
         * @param {string} userId 
         * @param {CharacterModel} characterDocument Mongoose Document to cache
         */
        set(guildId, userId, characterDocument) {
            // instantiate guild if not done already
            if (!cached.has(guildId)) cached.set(guildId, new Map());
            return cached.get(guildId).set(userId, characterDocument);
        },
        /**
         * Check to see if a Character is cached for this user
         * @param {string} guildId 
         * @param {string} userId 
         */
        has(guildId, userId) {
            return cached.get(guildId)?.has(userId) ?? false;
        },
        /**
         * Remove a mongoose document from the cache
         * @param {string} guildId 
         * @param {string} userId 
         */
        remove(guildId, userId) {
            return cached.get(guildId)?.delete(userId);
        }
    }
}

module.exports = CharacterCache;