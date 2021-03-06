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
 *      },
 *      hunting: {
 *          seasonDC: number,
 *          locked: boolean,
 *      },
 *      characterApprovalRequired: boolean,
 *      logging: {
 *          admin: string,
 *          player: string,
 *      },
 *      verification: {
 *          verificationThreadId: string
 *          deniedVerificationIds: Set<string>
 *          pendingToMessageId: Map<string, string>
 *          messageIdToPending: Map<string, string>
 *      },
 *      excusesMenuChannelId: string,
 *      excusesMenuMessageId: string,
 *      excusesChannelId: string,
 *      excusesThreads: Map<string, string>,
 *      excusesPaused: Map<string, string>,
 *      submissions: {
 *          channelId: string,
 *          messageIdToAuthorId: Map<messageId, submittingUserId>,
 *          authorIdToMessageId: Map<submittingUserId, messageId>,
 *          paused: {
 *              ages: Map<age, age>,
 *          },
 *      },
 *      roles: {
 *          adult: string
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
                preyPile: [],
                preyPileChannelId: null,
                preyPileMessageId: null,
                preyPileThreadId: null,
                clanRoleId: null,
            },
            riverclan: {
                preyPile: [],
                preyPileChannelId: null,
                preyPileMessageId: null,
                preyPileThreadId: null,
                clanRoleId: null,
            },
            shadowclan: {
                preyPile: [],
                preyPileChannelId: null,
                preyPileMessageId: null,
                preyPileThreadId: null,
                clanRoleId: null,
            },
            thunderclan: {
                preyPile: [],
                preyPileChannelId: null,
                preyPileMessageId: null,
                preyPileThreadId: null,
                clanRoleId: null,
            }
        },
    },
    logging: {
        admin: {
            type: String,
            default: null,
        },
        player: {
            type: String,
            default: null,
        },
    },
    characterApprovalRequired: {
        type: Boolean,
        default: true,
    },
    hunting: {
        seasonDC: {
            type: Number,
            default: 10,
        },
        locked: {
            type: Boolean,
            default: false,
        }
    },
    verification: {
        verificationThreadId: {
            type: String,
            default: null,
        },
        deniedVerificationIds: { // those who have been denied
            type: Map,
            of: String,
            default: new Map(),
        },
        pendingToMessageId: {
            type: Map,
            of: String,
            default: new Map(),
        },
        messageIdToPending: {
            type: Map,
            of: String,
            default: new Map(),
        }
    },
    excusesMenuChannelId: {
        type: String,
        default: null,
    },
    excusesMenuMessageId: {
        type: String,
        default: null,
    },
    excusesChannelId: {
        type: String,
        default: null,
    },
    excusesThreads: {
        type: Map,
        of: String,
        default: new Map(),
    },
    excusesPaused: {
        type: Map,
        of: String,
        default: new Map(),
    },
    submissions: {
        channelId: {
            type: String,
            default: null,
        },
        messageIdToAuthorId: {
            type: Map,
            of: String,
            default: new Map(),
        },
        authorIdToMessageId: {
            type: Map,
            of: String,
            default: new Map(),
        },
        paused: {
            ages: {
                type: Map,
                of: String,
                default: new Map(),
            },
        },
    },
    roles: {
        adult: {
            type: String,
            default: null,
        }
    },
});

/**@type {ServerSchema} */
module.exports = serverSchema;