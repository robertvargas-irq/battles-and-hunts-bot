const mongoose = require('mongoose');
const { Schema, Model } = require('mongoose');

const CharacterSchema = new Schema({
    guildId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        default: null,
    },
    personality: {
        type: String,
        default: null,
    },
    background: {
        type: String,
        default: null,
    },
    image: {
        type: String,
        default: null,
    },
    approved: {
        type: Boolean,
        default: false,
    },
    moons: {
        type: Number,
        default: -1,
    },
    stats: {
        cat_size: {
            type: Number,
            default: -1,
        },
        strength: {
            type: Number,
            default: -1,
        },
        dexterity: {
            type: Number,
            default: -1,
        },
        constitution: {
            type: Number,
            default: -1,
        },
        speed: {
            type: Number,
            default: -1,
        },
        intelligence: {
            type: Number,
            default: -1,
        },
        charisma: {
            type: Number,
            default: -1,
        },
        swimming: {
            type: Number,
            default: -1,
        },
        stalking: {
            type: Number,
            default: -1
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
 * name: string,
 * personality: string,
 * background: string,
 * image: string,
 * approved: string,
 * moons: number,
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
 * @type {Model & Character}
 * 
*/
module.exports = mongoose.model('Character', CharacterSchema);