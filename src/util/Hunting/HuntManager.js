const serverSchema = require('../../database/schemas/server');
const clanPrey = require('./prey.json');
const huntChecks = require('./huntChecks.json');
const userSchema = require('../../database/schemas/user');
const { Collection, MessageEmbed, BaseCommandInteraction, GuildMember } = require('discord.js');
const CoreUtil = require('../CoreUtil');

/**@typedef {'unforgiven'|'riverclan'|'shadowclan'|'thunderclan'} clans */
/**@typedef {{name: string, size: number, bites_remaining: number}} prey */


class HuntManager extends CoreUtil {
    static MAX_WEIGHT = 3;
    static INVENTORY_MAX_WEIGHT = 7;
    static #MAX_HUNT_TIMERS = 5;
    static #MAX_DEPOSIT_TIMERS = 2;
    static #HUNT_COOLDOWN = (30 * 1000) // 30 seconds
    static #DEPOSIT_COOLDOWN = (30 * 60 * 1000) // 30 minutes
    static #Random = (min, max) => { return Math.floor(Math.random() * (max - min + 1) + min) };
    static #RandomFromArray = (a) => { return a[this.#Random(0, a.length - 1)] }
    
    /**
     * @type {Map<string, prey>}
     * Player ID to their recently caught prey */
    static #playerIdToRecentlyCaught = new Map();

    /**
     * @type {Map<string, [weight, prey[]]>}
     * Player ID to their inventory */
    static #playerIdToInventory = new Map();

    /**
     * @type {Collection<string, number[]>}}
     * Map of 2 cooldown timers for /hunt */
    static #cooldownHunt = new Collection();

    /**
     * @type {Collection<string, number[]>}}
     * Map of 2 cooldown timers for /deposit */
    static #cooldownDeposit = new Collection();

    /**
     * Check to see if user is on cooldown for /hunt;
     * Remove cooldown if applicable
     * @param {string} userId User to check for
     */
    static onCooldownHunt(userId) {
        const timers = this.#cooldownHunt.get(userId);
        console.log(this.#cooldownHunt.get(userId));

        // if no cooldown at all
        if (!timers) return false;

        // if the queue is not full
        if (timers.length < this.#MAX_HUNT_TIMERS) return false;

        // if the front timer is satisfied, unqueue and return false
        if (Date.now() - timers[0] >= this.#HUNT_COOLDOWN) {
            if (timers.length <= 1) this.#cooldownHunt.delete(userId);
            else timers.shift();
            return false;
        }

        // all checks failed, not on cooldown
        return true;
    }

    /**
     * Check to see if user is on cooldown for /deposit;
     * Remove cooldown if applicable
     * @param {string} userId User to check for
     */
    static onCooldownDeposit(userId) {
        const timers = this.#cooldownDeposit.get(userId);
        console.log(this.#cooldownDeposit.get(userId));

        // if no cooldown at all
        if (!timers) return false;

        // if the queue is not full
        if (timers.length < this.#MAX_DEPOSIT_TIMERS) return false;

        // if the front timer is satisfied, unqueue and return false
        if (Date.now() - timers[0] >= this.#DEPOSIT_COOLDOWN) {
            if (timers.length <= 1) this.#cooldownDeposit.delete(userId);
            else timers.shift();
            return false;
        }

        // all checks failed, not on cooldown
        return true;
    }

    /**
     * Add a cooldown for /hunt
     * @param {string} userId The user ID to add to cooldown list
     */
    static addCooldownHunt(userId) {
        const cooldowns = this.#cooldownHunt;
        const timers = cooldowns.get(userId);
        if (timers)
            timers.push(Date.now());
        else cooldowns.set(userId, [Date.now()]);
        console.log(cooldowns);
    }

    /**
     * Add a cooldown for /deposit
     * @param {string} userId The user ID to add to the cooldown list
     */
    static addCooldownDeposit(userId) {
        const cooldowns = this.#cooldownDeposit;
        const timers = cooldowns.get(userId);
        if (timers)
            timers.push(Date.now());
        else cooldowns.set(userId, [Date.now()]);
        console.log(cooldowns);
    }
    

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
        const tracked = trackRoll + trackProf >= server.hunting.seasonDC;
        const caught = catchRoll + catchProf >= server.hunting.seasonDC;

        // if hunting is not locked, and prey has been caught, add to recently caught and record results
        if (!server.hunting.locked) { // (if canon)
            if (tracked && caught) {
                this.setRecentlyCaught(interaction.user.id, prey);
                hunter.hunting.hunts.successful++;
            }
            else {
                hunter.hunting.hunts.unsuccessful++;
            }
            hunter.save(); // save to the database
        }

        // display the results of the roll
        const results = new MessageEmbed()
            .setColor(tracked ? caught ? 'GREEN' : 'YELLOW' : 'RED')
            .setTitle('🎲 __Hunt Roll Results__ 🎲')
            .setThumbnail(interaction.member.displayAvatarURL())
            .setDescription(
            // track roll breakdown
            'Roll Breakdowns:\n**- - - - - -**'
            + `\n__(1d20 + ${trackProf}) Track Roll__: ${tracked ? '✅' : '⛔'}`
            + `\n> **Rolled**: \`${trackRoll}\` / \`20\``
            + `\n> **Current Territory**: \`${territory.toUpperCase()}\` (\`+${huntChecks[territory][0].toUpperCase()}\`)`
            + `\n> **Season DC**: \`${server.hunting.seasonDC}\``
            + `\n> \`${trackRoll + trackProf}\` ${tracked ? '≥' : '<'} \`${server.hunting.seasonDC}\``
            + ( // roll breakdown
                tracked
                ? `\n__(1d20 + ${catchProf}) Catch Roll__: ${caught ? '✅' : '⛔'}`
                + `\n> **Rolled**: \`${catchRoll}\` / \`20\``
                + `\n> **Current Territory**: \`${territory.toUpperCase()}\` (\`+${huntChecks[territory][1].toUpperCase()}\`)`
                + `\n> **Season DC**: \`${server.hunting.seasonDC}\``
                + `\n> \`${catchRoll + catchProf}\` ${caught ? '≥' : '<'} \`${server.hunting.seasonDC}\``
                : ''
            )
            + '\n**- - - - - -**\n'
            + ( // display a success message if tracked and caught
                (tracked && caught)
                ? `\n> 🍽️ **${interaction.member.displayName}, you have caught dinner!**`
                + `\n> You have caught a(n) \`${prey.name.toUpperCase()}\`, and it looks rather ${clanPrey.descriptors[prey.size - 1]}! (\`size\`: \`${prey.size}\`)`
                + '\n> '
                + ( // display a message if hunting is locked in the server
                    server.hunting.locked
                    ? '\n> 🔒 **Hunting is currently restricted.**'
                    + '\n> Due to no current active session, prey __cannot__ be carried or deposited. If you believe this is a mistake, please contact an administrator.'
                    : '\n> **⚠️ IF YOU WISH TO \`CARRY\` THIS ON YOUR BACK, USE \`/carry\`**'
                    + '\n> **➡️ TO \`DEPOSIT\` ANY PREY BEING CARRIED TO THE PREY PILE, USE \`/deposit\`**'
                )
            : ( // display a message if only tracked or neither tracked nor caught
                (tracked)
                ? `\n> 🔍❗ **You spotted a(n) ${clanPrey.descriptors[prey.size - 1]}-sized \`${prey.name.toUpperCase()}\`!**`
                + '\n> Unfortunately, it scurries away before you could catch it!'
                : '\n> 🍃 **You were unable to find any prey!**'
                + '\n> Nothing but the sound of the breeze.'
            ))).setFooter({ text: server.hunting.locked ? '🔒 Hunting is heavily restricted.' : '🍃 This hunt is canon.' });
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
        if (!prey) {
            this.#playerIdToRecentlyCaught.delete(userId);
            return null;
        }
        this.#playerIdToRecentlyCaught.set(userId, prey);
        console.log(this.#playerIdToRecentlyCaught);
        return prey;
    }
    
    /**
     * Get the user's most recently caught prey item
     * @param {string} userId The player who caught the prey
     * @returns {prey}
     */
    static getRecentlyCaught(userId) {
        console.log(this.#playerIdToRecentlyCaught);
        return this.#playerIdToRecentlyCaught.get(userId);
    }

    /**
     * Add to a user's caught prey
     * @param {string} userId The player to add to their carry
     * @param {prey} prey The prey to add to their carry
     * @returns {Array} [`AbleToAdd`, `WeightCarried`, `CurrentlyCarrying`]
     */
    static addToCarry(userId, prey) {

        // get player inventory else create one
        let inventory = this.#playerIdToInventory.get(userId);
        if (!inventory) {
            this.#playerIdToInventory.set(userId, [0, []]);
            inventory = this.#playerIdToInventory.get(userId);
        }
        const weight = inventory[0];
        const carried = inventory[1];

        // check to see if able to carry
        if (prey.bites_remaining + weight > this.INVENTORY_MAX_WEIGHT)
            return [false, inventory[0], inventory[1]];
        
        // add to carried and increase weight
        carried.push(prey);
        inventory[0] = inventory[0] + prey.bites_remaining;

        // remove from recently caught
        this.setRecentlyCaught(userId, null);
        console.log(inventory);
        console.log(this.#playerIdToInventory.get(userId));

        // return success and new weight and inventory
        return [true, inventory[0], inventory[1]];
    }

    /**
     * Get all the carried items
     * @param {string} userId The player to remove from carry
     * @returns {prey[]} All the prey in their inventory
     */
    static removeFromCarry(userId) {
        const inventory = this.#playerIdToInventory.get(userId);
        if (!inventory) return [];

        // cache inventory then empty player inventory
        const inventoryItems = inventory[1];
        this.#playerIdToInventory.set(userId, [0, []]);

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
            pile.push(prey[i]);
        
        // mark to save
        server.markModified(`clans.${clan}`);
        
        return pile;
    }

    static formatPrey(preyList) {
        // count each prey in the list
        const counter = new Map();
        for (let i = 0; i < preyList.length; i++) {
            counter.set(preyList[i].name, (counter.get(preyList[i].name) || 0) + 1);
        }
        console.log(counter);
        
        // return a formatted string
        return Array.from(counter.entries()).map(([k, v]) => {
            console.log(k, v);
            return `↣ **(${v}) ${k[0].toUpperCase() + k.substring(1)}**`
        }).join('\n');
    }

    /**
     * Display that hunting is currently restricted
     * @param {BaseCommandInteraction} interaction Interaction to edit
     */
    static async displayRestrictedHunting(interaction) {
        return await this.SendAndDelete(interaction, {
            embeds: [new MessageEmbed()
                .setColor('YELLOW')
                .setTitle('🔒 Hunting is currently limited.')
                .setDescription(
                    'It is possible that canon roleplay sessions are not in progress, so `certain` Hunt `features` are `restricted`.'
                    + ' Locks are enabled manually by the administrative team.'
                    + ' If you believe this was a mistake, please contact an administrator.'
                )
            ]
        });
        // return await interaction.editReply({
        //     embeds: [new MessageEmbed()
        //         .setColor('YELLOW')
        //         .setTitle('🔒 Hunting is currently limited.')
        //         .setDescription(
        //             'It is possible that canon roleplay sessions are not in progress, so `certain` Hunt `features` are `restricted`.'
        //             + ' Locks are enabled manually by the administrative team.'
        //             + ' If you believe this was a mistake, please contact an administrator.'
        //         )
        //     ]
        // });
    }

    /**
     * Display that the user is on cooldown for /hunt
     * @param {BaseCommandInteraction} interaction Original Discord interaction
     */
    static async displayCooldownHunt(interaction) {
        let minutes = ((this.#HUNT_COOLDOWN - (Date.now() - this.#cooldownHunt.get(interaction.user.id)[0])) / 60 / 1000).toFixed(1);
        return await interaction.editReply({
            embeds: [new MessageEmbed({
                color: 'FUCHSIA',
                title: '💫 Feeling a little winded',
                description: '**You\'re feeling a bit tired...**'
                + '\nMaybe take a brief rest after trying `'
                + (this.#MAX_HUNT_TIMERS) + '` hunt' + (this.#MAX_HUNT_TIMERS != 1 ? 's' : '')
                + ' for at least `'
                + (minutes >= 1 ? minutes : minutes * 60)
                + '` more '
                + (minutes >= 1 ? 'minutes' : 'seconds') + '.'
            })]
        });
    }

    /**
     * Display that the user is on cooldown for /deposit
     * @param {BaseCommandInteraction} interaction Original Discord interaction
     */
    static async displayCooldownDeposit(interaction) {
        let minutes = ((this.#DEPOSIT_COOLDOWN - (Date.now() - this.#cooldownDeposit.get(interaction.user.id)[0])) / 60 / 1000).toFixed(1);
        return await interaction.editReply({
            embeds: [new MessageEmbed({
                color: 'FUCHSIA',
                title: '💤 W...Wait...',
                description: '**You\'re feeling a bit tired...**'
                + '\nYou can feel everything ache.'
                + '\nYou wish to rest after making `'
                + (this.#MAX_DEPOSIT_TIMERS) + ' journey' + (this.#MAX_DEPOSIT_TIMERS != 1 ? 's' : '')
                + '` for at least `'
                + (minutes >= 1 ? minutes : minutes * 60)
                + '` more '
                + (minutes >= 1 ? 'minutes' : 'seconds') + '.'
            })]
        });
    }

    /**
     * Format hunting stats in an embed
     * @param {userSchema} user User entry in the database
     * @param {GuildMember} memberSnowflake Member desired
     */
    static formatStats(user, memberSnowflake) {
        return new MessageEmbed({
            color: 'DARK_VIVID_PINK',
            thumbnail: { url: memberSnowflake.displayAvatarURL() },
            title: '🥩 Hunting Stats and Contributions',
            description: '**These are 🍃 canon contributions!**'
            + '\n*(These only update when Hunting is not `restricted`)*',
            fields: [
                {
                    name: 'Hunting',
                    value: 'Successful Hunts: `' + user.hunting.hunts.successful + '`'
                    + '\nUnsuccessful Hunts: `' + user.hunting.hunts.unsuccessful + '`'
                },
                {
                    name: 'Contributions',
                    value: 'Total Prey Count: `' + user.hunting.contributions.preyCount + '`'
                    + '\nTotal Prey Weight: `' + user.hunting.contributions.preyWeight + '` `lbs.`'
                },
                {
                    name: 'Hunting Trips',
                    value: '*(number of `/deposit`s)*'
                    + '\nTrips Made: `' + user.hunting.trips + '`'
                }
            ]
        })
    }

}


module.exports = HuntManager;