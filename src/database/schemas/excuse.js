const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const ExcuseSchema = new Schema({
    guildId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    day: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: 'PENDING',
    },
    processingMessageId: { // messageId for moderator's approval/denial
        type: String,
    },
});

/**
 * @typedef {{
 * guildId: string,
 * userId: string,
 * day: string,
 * type: string,
 * reason: string,
 * status: {'PENDING'|'APPROVED'|'DENIED'},
 * processingMessageId: string,
 * }} Excuse
 * @type {Excuse}
 * 
*/
module.exports = mongoose.model('Excuse', ExcuseSchema);