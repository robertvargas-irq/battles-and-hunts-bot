const { Schema } = require('mongoose');
const { default: mongoose } = require('mongoose');

/**
 * @typedef {{
 *      userId: string,
 *      stats: {
 *          constitution: number,
 *          strength: number,
 *          speed: number,
 *          dexterity: number,
 *      },
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
            constitution: 0,
            strength: 0,
            speed: 0,
            dexterity: 0,
        },
    },
});

module.exports = userSchema;