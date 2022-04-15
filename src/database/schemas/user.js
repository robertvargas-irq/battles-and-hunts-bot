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
 *      hunting: {
 *          contributions: {
 *              preyCount: number,
 *              preyWeight: number,
 *          },
 *          hunts: {
 *              successful: number,
 *              unsuccessful: number,
 *          },
 *          trips: Number,
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
        cat_size: {
            type: Number,
            default: 0,
        },
        strength: {
            type: Number,
            default: 0,
        },
        dexterity: {
            type: Number,
            default: 0,
        },
        constitution: {
            type: Number,
            default: 0,
        },
        speed: {
            type: Number,
            default: 0,
        },
        intelligence: {
            type: Number,
            default: 0,
        },
        charisma: {
            type: Number,
            default: 0,
        },
        swimming: {
            type: Number,
            default: 0,
        },
        stalking: {
            type: Number,
            default: 0
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
    hunting: {
        contributions: {
            preyCount: {
                type: Number,
                default: 0,
            },
            preyWeight: {
                type: Number,
                default: 0,
            }
        },
        hunts: {
            successful: {
                type: Number,
                default: 0,
            },
            unsuccessful: {
                type: Number,
                default: 0,
            }
        },
        trips: {
            type: Number,
            default: 0,
        }
    }
});

module.exports = userSchema;