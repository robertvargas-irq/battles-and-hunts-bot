const mongoose = require('mongoose');
const { Schema, Model } = require('mongoose');
const stats = require('../../util/CharacterMenu/stats.json');

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
    icon: {
        type: String,
        default: null,
    },
    approved: {
        type: Boolean,
        default: false,
    },
    moons: {
        type: Number,
        default: 0,
    },
    stats: {
        cat_size: {
            type: Number,
            default: stats.cat_size.range[0],
        },
        strength: {
            type: Number,
            default: stats.strength.range[0],
        },
        dexterity: {
            type: Number,
            default: stats.dexterity.range[0],
        },
        constitution: {
            type: Number,
            default: stats.constitution.range[0],
        },
        speed: {
            type: Number,
            default: stats.speed.range[0],
        },
        intelligence: {
            type: Number,
            default: stats.intelligence.range[0],
        },
        charisma: {
            type: Number,
            default: stats.charisma.range[0],
        },
        swimming: {
            type: Number,
            default: stats.swimming.range[0],
        },
        stalking: {
            type: Number,
            default: stats.stalking.range[0],
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
    lastAteAt: {
        type: Number,
        default: 0,
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
 * icon: string,
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
 * lastAteAt: number,
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