const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const MemberSchema = new Schema({
    guildId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    excuses: {
        approved: {
            total: {
                type: Number,
                default: 0,
            },
            absence: {
                type: Number,
                default: 0,
            },
            late: {
                type: Number,
                default: 0,
            },
            left_early: {
                type: Number,
                default: 0,
            },
        },
        denied: {
            total: {
                type: Number,
                default: 0,
            },
            absence: {
                type: Number,
                default: 0,
            },
            late: {
                type: Number,
                default: 0,
            },
            left_early: {
                type: Number,
                default: 0,
            },
        },
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
    }
});

/**
 * @typedef {{
 * guildId: string,
 * userId: string,
 * excuses: {
 *      approved: {
 *          total: number,
 *          absence: number,
 *          late: number,
 *          left_early: number,
 *      },
 *      denied: {
 *          total: number,
 *          absence: number,
 *          late: number,
 *          left_early: number,
 *      },
 * },
 * hunting: {
 *      contributions: {
 *          preyCount: number,
 *          preyWeight: number,
 *      },
 *      hunts: {
 *          successful: number,
 *          unsuccessful: number,
 *      },
 *      fullInventoryTrips: number
 *      trips: Number,
 * },
 * }} Member
 * @type {Member}
 * 
*/
module.exports = mongoose.model('Member', MemberSchema);