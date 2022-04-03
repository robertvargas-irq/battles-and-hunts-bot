const { Schema } = require("mongoose");

/**
 * @typedef {'unforgiven'|'riverclan'|'shadowclan'|'thunderclan'} clans
 * @typedef {{name: string, size: number, bites_remaining: number}} prey
 * @typedef {{
 *      guildId: string,
 *      clans: {
 *          [clan: keyof clans]:{
 *              preyPile: prey[]
 *          }
 *      }
 * }} ServerSchema
 */

/**@type {ServerSchema} */
const serverSchema = new Schema({
    guildId: {
        type: String,
        unique: true,
        required: true,
    },
    clans: {
        type: {},
        default: {
            unforgiven: {
                preyPile: []
            },
            riverclan: {
                preyPile: []
            },
            shadowclan: {
                preyPile: []
            },
            thunderclan: {
                preyPile: []
            }
        },
    },
    seasonDC: {
        type: Number,
        default: 10
    }
});

module.exports = serverSchema;