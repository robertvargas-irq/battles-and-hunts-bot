const ServerModel = require('../../database/schemas/server');

/**
 * @typedef {Map<guildId: string, Map<userId: string, ServerModel>>} ServerCache
 * @type {ServerCache} */
const cached = new Map();

class ServerCache {

    /**
     * Cache all server documents from the database
     * @returns {ServerCache}
     */
    static async CacheServers() {
        const Servers = await require('../CoreUtil').Servers.FetchAll();
        for (const server of Servers)
            cached.set(server.guildId, server);

        return cached;
    }

    /** Cache for all Servers */
    static cache = {
        /**
         * Get one cached Server
         * @param {string} guildId Requested guild id
         * @returns {ServerModel}
         */
        get(guildId) {
            return cached.get(guildId);
        },
        /**
         * Get all cached Servers
         * @returns {ServerCache}
         */
        getAll() {
            return cached;
        },
    }
}

module.exports = ServerCache;