const preyFromLocations = require('./prey.json');

class Prey {

    /**
     * Type definitions
     * @typedef {{
     * bites?: {min?: number, max?: number},
     * requiresTracking?: boolean,
     * requiresCatching?: boolean,
     * messages?: {
     *      tracked?: {
     *          success?: string,
     *          fail?: string,
     *      },
     *      caught?: {
     *          success?: string,
     *          fail?: string,
     *      },
     *      size?: string[]
     * },
     * }} overrides
     * @typedef {'unforgiven'|'riverclan'|'shadowclan'|'thunderclan'} clans
     * @typedef {{name: string, size: number, bites_remaining: number, overrides: overrides}} prey
     * @typedef {
     * 'outpost-rock'|'gorge'|'barn'|'snake-rocks'|'sandy-hollow'|'thunderpath'|'burnt-sycamore'|'pond'|'river'|'carrion-place'
     * } locations
     */

    static #Random = (min, max) => { return Math.floor(Math.random() * (max - min + 1) + min) };
    static #RandomFromArray = (a) => { return a[this.#Random(0, a.length - 1)] } 

    /**
     * Generate a random prey object
     * @param {locations} location
     * @returns {prey}
     */
    static generateRandomPreyItem(location, maxSize) {
        const preyName = this.#RandomFromArray(preyFromLocations[location]);
        const overrides = preyFromLocations.overrides[preyName] || false;
        const sizeRoll = this.#Random(
            overrides?.bites?.min || 1,
            overrides?.bites?.max || maxSize
        );
        return {
            name: preyName,
            size: sizeRoll,
            bites_remaining: sizeRoll,
            visual: preyFromLocations.visuals[preyName],
            overrides,
        }
    }
}

module.exports = Prey;