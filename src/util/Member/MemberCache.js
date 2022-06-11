const MemberModel = require('../../database/schemas/member');

/**
 * @typedef {Map<guildId: string, Map<userId: string, MemberModel>>} MemberCache
 * @type {MemberCache} */
const cached = new Map();

class MemberCache {

    /**
     * Cache all character documents from the database
     * @returns {MemberCache}
     */
    static async CacheMembers() {
        const Members = await require('../CoreUtil').Members.FetchAllGuildless();
        for (const member of Members) {
            // initiate guild cache if not already created then assign the character to the cache
            if (!cached.has(member.guildId))
                cached.set(member.guildId, new Map());
            cached.get(member.guildId).set(member.userId, member);
        }

        return cached;
    }

    /** Cache for all Members */
    static cache = {
        /**
         * Get one cached Character from a guild
         * @param {string} guildId Requested guild id
         * @param {string} userId Requested user id
         * @returns {MemberModel}
         */
        get(guildId, userId) {
            // handle non-existent guild
            if (!cached.has(guildId)) return undefined;
            
            return cached.get(guildId).get(userId);
        },
        /**
         * Get all cached Members from a guild
         * @param {string} guildId Requested guild id
         * @returns {Map<userId: string, MemberModel>}
         */
        getAll(guildId) {
            return cached.get(guildId);
        },
        /**
         * Get all cached Members regardless of guild
         * @returns {MemberCache}
         */
        getAllGuildless() {
            return cached;
        },
        set(guildId, userId, memberDocument) {
            // instantiate guild if not done already
            if (!cached.has(guildId)) cached.set(guildId, new Map());
            return cached.get(guildId).set(userId, memberDocument);
        },
    }
}

module.exports = MemberCache;