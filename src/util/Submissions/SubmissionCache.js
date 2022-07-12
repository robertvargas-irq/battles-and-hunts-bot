const SubmissionModel = require('../../database/schemas/submission');
const { Query } = require('mongoose');

/**
 * @typedef {Map<guildId, Map<userId, SubmissionModel>>} SubmissionCache
 * @type {SubmissionCache}
 */
const cached = new Map();
const cache = {
    get(guildId, userId) {
        return cached.get(guildId)?.get(userId);
    },
    getAll(guildId) {
        return cached.get(guildId);
    },
    getAllGuildless() {
        return cached;
    },
    /**
     * Cache a Submission
     * @param {string} guildId 
     * @param {string} userId 
     * @param {SubmissionModel} submission 
     */
    put(guildId, userId, submission) {
        (cached.get(guildId) || cached.set(guildId, new Map()))
        .set(userId, submission);
    },
    /**
     * Remove a Submission from the cache
     * @param {string} guildId 
     * @param {string} userId 
     * @returns {boolean} True if removed | False if it did not exist
     */
    remove(guildId, userId) {
        const guildCache = cached.get(guildId);
        if (!guildCache) return false;

        return guildCache.delete(userId);
    }
}

/**
 * Cache every submission into memory
 * @returns {Promise<cache>}
 */
async function CacheSubmissions() {
    const submissions = await FetchAllGuildless();

    // cache each submission
    for (let i = 0; i < submissions.length; i++)
        cache.put(submissions[i].guildId, submissions[i].userId, submissions[i]);
    
    return cache;
}


/**
 * Fetch an open user submission from a guild
 * @param {string} guildId Guild to fetch from
 * @param {string} userId User submission to retrieve
 * @param {SubmissionModel} extraParameters
 * @returns {Query & Promise<SubmissionModel>?}
 */
async function FetchOne(guildId, userId) {
    return SubmissionModel.findOne({ guildId, userId, ...extraParameters });
}

/**
 * Fetch all open user submissions from a guild
 * @param {string} guildId Guild to fetch from
 * @param {SubmissionModel} extraParameters 
 * @returns {Query & Promise<SubmissionModel>?}
 */
async function FetchAll(guildId, extraParameters = {}) {
    return SubmissionModel.find({ guildId, ...extraParameters });
}

/**
 * Fetch all Submissions without guild
 * @param {SubmissionModel} parameters 
 * @returns {Query & Promise<SubmissionModel>?}
 */
async function FetchAllGuildless(parameters = {}) {
    return SubmissionModel.find(parameters);
}



module.exports = {
    FetchOne,
    FetchAll,
    FetchAllGuildless,
    CacheSubmissions,
    cache,
}