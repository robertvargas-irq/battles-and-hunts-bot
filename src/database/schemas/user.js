const { Schema } = require('mongoose');
/* TEMPLATE
 * --------
 * Strength:     5        [35/40]
 * Dexterity:    8        [27/40]
 * Constitution: 5        [22/40]
 * Speed:        8        [14/40]
 * Intelligence: 4        [10/40]
 * Charisma:     1        [ 9/40]
 * Swimming:     4        [ 5/40]
 * Stalking:     5        [ 0/40]
 */

/**
 * @typedef {{
 *      userId: string,
 *      stats: {
 *          cat_size: number,
 *          strength: number,
 *          dexterity: number,
 *          constitution: number,
 *          speed: number,
 *          intelligence: number,
 *          charisma: number,
 *          swimming: number,
 *          stalking: number
 *      },
 *      currentHealth: number,
 *      currentHunger: number,
 *      clan: string,
 * }} UserSchema
 */

/**
 * User Schema
 * @type {UserSchema}
 */
const userSchema = new Schema({
    userId: {
        type: String,
        unique: true,
        required: true,
    },
    stats: {      // dunno if I should split into diff
        type: {},
        default: {
            cat_size: 0,
            strength: 0,
            dexterity: 0,
            constitution: 0,
            speed: 0,
            intelligence: 0,
            charisma: 0,
            swimming: 0,
            stalking: 0
        },
    },
    currentHealth: {
        type: Number,
        default: 0,
    },
    currentHunger: {
        type: Number,
        default: 0,
    },
    clan: {
        type: String,
        default: null,
    },
});

module.exports = userSchema;