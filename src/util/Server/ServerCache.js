const mongoose = require('mongoose');
const ServerSchema = require('../../database/schemas/server');
const ServerModel = new mongoose.model('Server', ServerSchema);

/**
 * @typedef {Map<guildId, Map<userId, ServerSchema>>} ServerCacheMap
 * @type {ServerCacheMap} */
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
         * @returns {ServerSchema}
         */
        get(guildId) {
            let server = cached.get(guildId);
            if (!server) server = new ServerModel({ guildId });

            return server;
        },
        /**
         * Get all cached Servers
         * @returns {ServerCache}
         */
        getAll() {
            return cached;
        },
        /**
         * Check to see if a Server is cached
         * @param {string} guildId 
         */
        has(guildId) {
            return cached.has(guildId) ?? false;
        },
    }
}

module.exports = ServerCache;