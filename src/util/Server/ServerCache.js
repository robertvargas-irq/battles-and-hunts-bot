const mongoose = require('mongoose');
const ServerSchema = require('../../database/schemas/server');
const ServerModel = new mongoose.model('Server', ServerSchema);

/**
 * @typedef {Map<guildId: string, Map<userId: string, ServerSchema>>} ServerCache
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
         * @returns {ServerSchema}
         */
        get(guildId) {
            let server = cached.get(guildId);

            if (!server) {
                server = new ServerModel({ guildId });
                server.save();
            }

            return server;
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