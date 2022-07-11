const SubmissionModel = require('../../database/schemas/submission');

/**
 * @typedef {Map<guildId: string, Map<userId: string, SubmissionModel>>} SubmissionCache
 * @type {SubmissionCache}
 */
const cached = new Map();

module.exports = {
    async FetchOne() {

    },
    cache: {
        get(guildId, userId) {

        },
        getAll(guildId) {

        },
        getAllGuildless() {

        }
    }
}