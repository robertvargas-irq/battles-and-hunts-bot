const serverSchema = require('../../database/schemas/server');
const clanPrey = require('./prey.json');
const huntChecks = require('./huntChecks.json');
const userSchema = require('../../database/schemas/user');
const { MessageEmbed, BaseCommandInteraction } = require('discord.js');
const MAX_WEIGHT = 3;
// const MAX_ROLL = 20;


/**@typedef {'unforgiven'|'riverclan'|'shadowclan'|'thunderclan'} clans */
/**@typedef {{name: string, size: number, bites_remaining: number}} prey */

/**@type {Map<string, prey>} */
const playerIdToRecentlyCaught = new Map();
/**@type {Map<string, [weight, prey[]]>} */
const playerIdToPreyCarried = new Map();


class HuntManager {
    
    static #Random = (min, max) => { return Math.floor(Math.random() * (max - min + 1) + min) };
    static #RandomFromArray = (a) => { return a[this.#Random(0, a.length)] }

    /**
     * Roll for track.
     * @param {clans} territory The current hunting territory.
     * @param {number} max Max die roll.
     * @returns Random number from 1 to MAX.
     */
    static rollTrack(max) {
        return this.#Random(1, max);
    }

    /**
     * Roll for catch.
     * @param {clans} territory The current hunting territory.
     * @param {number} max Max die roll.
     * @returns Random number from 1 to MAX.
     */
    static rollCatch(max) {
        return this.#Random(1, max);
    }

    /**
     * Generate a random prey object
     * @param {clans} territory
     * @returns {prey}
     */
    static generatePrey(territory, maxSize) {
        let sizeRoll = this.#Random(1, maxSize);
        return {
            name: this.#RandomFromArray(clanPrey[territory]),
            size: sizeRoll,
            bites_remaining: sizeRoll
        }
    }

    /**
     * Display the resulting rolls to the player.
     * @param {BaseCommandInteraction} interaction
     * @param {userSchema} hunter User information from the database.
     * @param {serverSchema} server Server information from the database. 
     * @param {clans} territory The current territory being hunted in.
     * @param {number} trackRoll Result of a track roll.
     * @param {number} catchRoll Result of a catch roll.
     * @param {prey} prey The prey that would have been caught.
     */
    static generateAndDisplayResults(interaction, hunter, server, territory, trackRoll, catchRoll, prey) {
        // get proficiencies for current territory
        const trackProf = hunter.stats[huntChecks[territory][0]];
        const catchProf = hunter.stats[huntChecks[territory][1]];

        // check if DC's pass
        const tracked = trackRoll + trackProf >= server.seasonDC;
        const caught = catchRoll + catchProf >= server.seasonDC;

        // if prey has been caught, add to recently caught
        if (tracked && caught) this.setRecentlyCaught(interaction.user.id, prey);

        // display the results of the roll
        const results = new MessageEmbed()
            .setColor(tracked ? caught ? 'GREEN' : 'YELLOW' : 'RED')
            .setTitle('🎲 __Hunt Roll Results__ 🎲')
            .setDescription(
            // track roll breakdown
            `\
            Roll Breakdowns:
            **- - - - - -**
            __(1d20 + ${trackProf}) Track Roll__: ${tracked ? '✅' : '⛔'}
            > **Rolled**: \`${trackRoll}\` / \`20\`
            > **Current Territory**: \`${territory.toUpperCase()}\` (\`+${huntChecks[territory][0].toUpperCase()}\`)
            > **Season DC**: \`${server.seasonDC}\`
            > \`${trackRoll + trackProf}\` ${tracked ? '≥' : '<'} \`${server.seasonDC}\`
            `
            +
            // caught roll breakdown
            (tracked ? `\
            __(1d20 + ${catchProf}) Catch Roll__: ${caught ? '✅' : '⛔'}
            > **Rolled**: \`${catchRoll}\` / \`20\`
            > **Current Territory**: \`${territory.toUpperCase()}\` (\`+${huntChecks[territory][1].toUpperCase()}\`)
            > **Season DC**: \`${server.seasonDC}\`
            > \`${catchRoll + catchProf}\` ${caught ? '≥' : '<'} \`${server.seasonDC}\`
            ` : '')
            +
            '\n**- - - - - -**\n'
            +
            // descriptive result message
            (tracked && caught ? `\
            > 🍽️ **${interaction.member.displayName}, you have caught dinner!** 
            > You have caught a(n) \`${prey.name.toUpperCase()}\`, and it looks rather ${clanPrey.descriptors[prey.size - 1]}! (\`size\`: \`${prey.size}\`)
            > 
            > **⚠️ THIS IS A TESTING PERIOD OF THE \`/hunt\` COMMAND ⚠️**
            > \`THE BOTTOM TWO COMMANDS ARE NOT IMPLEMENTED YET AND ARE CURRENTLY UNDER DEVELOPMENT\`
            > 
            > **⚠️ IF YOU WISH TO \`CARRY\` THIS ON YOUR BACK, USE \`/carry\`**
            > **➡️ TO \`DEPOSIT\` ANY PREY BEING CARRIED TO THE PREY PILE, USE \`/deposit\`**
            `
            : (
            (tracked) ? `\
            > 🔍❗ **You spotted a(n) ${clanPrey.descriptors[prey.size - 1]}-sized \`${prey.name.toUpperCase()}\`!**
            > Unfortunately, it scurries away before you could catch it!
            `
            : `\
            > 🍃 **You were unable to find any prey!**
            > Nothing but the sound of the breeze.
            `
            )));
        return interaction.editReply({
            embeds: [results]
        });
    }

    /**
     * Set a user's recently caught to a prey
     * @param {string} userId The player who caught the prey
     * @param {prey} prey The prey that was caught
     * @returns {prey}
     */
    static setRecentlyCaught(userId, prey) {
        playerIdToRecentlyCaught.set(userId, prey);
        return prey;
    }

    /**
     * Add to a user's caught prey
     * @param {string} userId The player to add to their carry
     * @param {prey} prey The prey to add to their carry
     * @returns {Array} [`AbleToAdd`, `WeightCarried`, `CurrentlyCarrying`]
     */
    static addToCarry(userId, prey) {
        const inventory = playerIdToPreyCarried.get(userId);
        if (!inventory) playerIdToPreyCarried.set(userId, [0, []]);
        const weight = inventory[0];
        const carried = inventory[1];

        // check to see if able to carry
        if (prey + weight > MAX_WEIGHT)
            return [false, inventory[0], inventory[1]];
        
        // add to carried and increase weight
        carried.push(prey);
        inventory[0] += weight;
        
        // return success and new weight and inventory
        return [true, inventory[0], inventory[1]];
    }

    /**
     * Get all the carried items
     * @param {string} userId The player to remove from carry
     * @returns {prey[]} All the prey in their inventory
     */
    static removeFromCarry(userId) {
        const inventory = playerIdToPreyCarried.get(userId);
        if (!inventory) return [];

        // cache inventory then empty player inventory
        const inventoryItems = inventory[1];
        playerIdToPreyCarried.set(userId, [0, []]);

        // return inventory
        return inventoryItems;
    }

    /**
     * Add to a clan's prey-pile
     * @param {prey[]} prey The prey to add to the prey pile.
     * @param {clans} clan The clan to add to prey pile.
     * @param {serverSchema} server Current server's database entry.
     * @returns {prey[]} The current prey in the prey pile.
     */
    static addToPreyPile(prey, clan, server) {
        const pile = server.clans[clan].preyPile;
        for (let i = 0; i < prey.length; i++)
            pile.push(prey);
        
        return pile;
    }

    /**
     * Empty a clan's prey pile.
     * @param {clans} clan The clan's prey pile to empty.
     * @param {serverSchema} server Current server's database entry.
     * @returns {prey[]} The prey that WAS in the pile.
     */
    static emptyPreyPile(clan, server) {
        const pile = server.clans[clan].preyPile;
        server.clans[clan].preyPile = [];

        return pile;
    }

    /**
     * Pull a wanted amount from the prey pile.
     * @param {clans} clan The clan's prey pile to take and how much.
     * @param {serverSchema} server Current server's database entry.
     * @param {number} bitesToSatisfy The amount of bites needed to satisfy hunger.
     * @returns {{name:string, totalEaten:number}[]} The prey that was required to facilitate 
     */
    static pullFromPreyPile(clan, server, bitesToSatisfy) {
        const preyPile = server.clans[clan].preyPile.shift();

        // iterate through the pile until prey is depleted or bites satisfied
        /**@type {prey} */
        let pulled = null;
        let bites_taken = 0;
        let eatenPrey = {};
        while (preyPile.length > 0 && bitesToSatisfy > 0) {

            // unenqueue prey item
            pulled = preyPile[0];
            
            // see how many bites needed; either the full thing or bites needed to satisfy
            bites_taken = Math.min(pulled.bites_remaining, bitesToSatisfy);
            pulled.bites_remaining -= bites_taken;

            // if bites are left in the current pulled prey, re-add to the prey pile
            if (pulled.bites_remaining < 1)
                preyPile.shift();
            
            // record to eaten prey
            eatenPrey.set(
                pulled.name,
                eatenPrey.get(pulled.name)
                    + 1 * (bites_taken / pulled.bites_remaining)
            );

        }

        // return the prey needed to eat
        return Object.keys(eatenPrey).map(p => { return {name: p, amountEaten: eatenPrey[p]} });

    }

}


module.exports = HuntManager;