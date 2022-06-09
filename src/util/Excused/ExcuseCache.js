const ExcuseModel = require('../../database/schemas/excuse');

/**
 * @typedef {Map<excuseKey, ExcuseModel.exports>} cached
 * @type {cached}
 */
const cached = new Map();
const key = (...arguments) => arguments.join(':');

class ExcuseCache {

    /**
     * Cache all active excuses to pull up quickly for user review
     * @returns {{userToExcuses, guildToExcuses}}
     */
    static async CacheExcuses() {
        const Excuses = await require('../CoreUtil').Excuses.FetchAllGuildless();

        for (const excuse of Excuses) {

            // cache full excuse pattern
            cached.set(key(
                excuse.guildId,
                excuse.userId,
                excuse.day,
                excuse.type
            ), excuse);

        }

        return cached;
    }

    /** Cache for all Excuses */
    static cache = {
        add(excuse) {
            return cached.set(key(
                excuse.guildId,
                excuse.userId,
                excuse.day,
                excuse.type,
            ), excuse);
        },
        get(guildId, userId, day, type) {
            return cached.get(key(
                guildId,
                userId,
                day,
                type
            ));
        },
        remove(excuse) {
            return cached.delete(key(
                excuse.guildId,
                excuse.userId,
                excuse.day,
                excuse.type
            ));
        },
    }
}

module.exports = ExcuseCache;