const mongoose = require('mongoose');
const { Schema, Model } = require('mongoose');
const stats = require('../../util/Stats/stats.json');

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
    pronouns: {
        subjective: { // he/she/they/xe
            type: String,
            default: null,
        },
        objective: { // him/her/them/xem
            type: String,
            default: null,
        },
        possessive: { // his/hers/theirs/xeirs
            type: String,
            default: null,
        },
    },
    stats: {
        cat_size: {
            type: Number,
            default: stats.cat_size.min,
        },
        strength: {
            type: Number,
            default: stats.strength.min,
        },
        dexterity: {
            type: Number,
            default: stats.dexterity.min,
        },
        constitution: {
            type: Number,
            default: stats.constitution.min,
        },
        speed: {
            type: Number,
            default: stats.speed.min,
        },
        intelligence: {
            type: Number,
            default: stats.intelligence.min,
        },
        charisma: {
            type: Number,
            default: stats.charisma.min,
        },
        swimming: {
            type: Number,
            default: stats.swimming.min,
        },
        stalking: {
            type: Number,
            default: stats.stalking.min,
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
 * pronouns: {
 *      subjective: string,
 *      objective: string,
 *      possessive: string,
 * },
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