const CoreUtil = require('../CoreUtil');

const SESSION_DAYS = [
    'Friday', 'Saturday', 'Sunday'
];

const EXCUSE_TYPES = [
    'Absence',
    'Left Early',
    'Late',
];

class Excuse extends CoreUtil {
    
    constructor(interaction) {

    }

    static days = SESSION_DAYS;
    static types = EXCUSE_TYPES;

    /**
     * Parse day
     * @param {string} input User input
     * @returns Parsed day if 
     */
    static parseDay(input) {
        for (const day of SESSION_DAYS)
            if (input.toLowerCase() === day.toLowerCase())
                return day;
        
        return false;
    }

    /**
     * Validate type
     * @param {string} input User input
     * @returns True if valid
     */
    static parseType(input) {
        for (const type of EXCUSE_TYPES)
            if (input.replace(/ +/g, '').toLowerCase() === type.replace(/ +/g, '').toLowerCase())
                return type;
        
        return false;
    }

    static post(type, day, reason) {
        
    }

}

module.exports = Excuse;