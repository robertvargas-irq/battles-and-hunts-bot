const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const CharacterSchema = new Schema({
    guildId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    stats: {      // might become its own schema
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
        fullInventoryTrips: {
            type: Number,
            default: 0,
        },
        trips: {
            type: Number,
            default: 0,
        }
    },
});

/**
 * @typedef {{
 * guildId: string,
 * userId: string,
 * stats: {
 *      cat_size: number,
 *      strength: number,
 *      dexterity: number,
 *      constitution: number,
 *      speed: number,
 *      intelligence: number,
 *      charisma: number,
 *      swimming: number,
 *      stalking: number
 * },
 * currentHealth: number,
 * currentHunger: number,
 * clan: string,
 * hunting: {
 *      contributions: {
 *          preyCount: number,
 *          preyWeight: number,
 *      },
 *      hunts: {
 *          perfect: number
 *          successful: number,
 *          unsuccessful: number,
 *      },
 *      fullInventoryTrips: number,
 *      trips: Number,
 * },
 * }} Character
 * @type {Character}
 * 
*/
module.exports = mongoose.model('Character', CharacterSchema);