const serverSchema = require('../../database/schemas/server');
const preyFromLocations = require('./prey.json');
const huntChecks = require('./huntChecks.json');
const userSchema = require('../../database/schemas/user');
const { Collection, MessageEmbed, BaseCommandInteraction, GuildMember } = require('discord.js');
const CoreUtil = require('../CoreUtil');

/**
 * Type definitions
 * @typedef {'unforgiven'|'riverclan'|'shadowclan'|'thunderclan'} clans
 * @typedef {{name: string, size: number, bites_remaining: number}} prey
 * @typedef {
 * 'outpost-rock'|'gorge'|'barn'|'snake-rocks'|'sandy-hollow'|'thunderpath'|'burnt-sycamore'|'pond'|'river'|'carrion-place'
 * } locations
 */


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
     * @param {locations} location
     * @returns {prey}
     */
    static generatePrey(location, maxSize) {
        let sizeRoll = this.#Random(1, maxSize);
        let preyName = this.#RandomFromArray(preyFromLocations[location]);
        return {
            name: preyName,
            size: sizeRoll,
            bites_remaining: sizeRoll,
            visual: preyFromLocations.visuals[preyName]
        }
    }

    /**
     * Display the resulting rolls to the player.
     * @param {BaseCommandInteraction} interaction
     * @param {userSchema} hunter User information from the database.
     * @param {serverSchema} server Server information from the database. 
     * @param {clans} territory The current territory being hunted in.
     * @param {locations} location The location type within the territory being hunted in.
     * @param {number} trackRoll Result of a track roll.
     * @param {number} catchRoll Result of a catch roll.
     * @param {prey} prey The prey that would have been caught.
     */
    static generateAndDisplayResults(interaction, hunter, server, territory, location, trackRoll, catchRoll, prey) {
        // get proficiencies for current territory
        const [trackProfName, catchProfName] = huntChecks[territory];
        const trackProf = Math.floor(hunter.stats[trackProfName] / 2);
        const catchProf = Math.floor(hunter.stats[catchProfName] / 2);

        // check if DC's pass
        const tracked = trackRoll + trackProf >= server.hunting.seasonDC;
        const caught = catchRoll + catchProf >= server.hunting.seasonDC;

        // if hunting is not locked, and prey has been caught, add to recently caught and record results
        if (!server.hunting.locked) { // (if canon)
            if (tracked && caught) {
                this.setRecentlyCaught(interaction, interaction.user.id, prey);
                hunter.hunting.hunts.successful++;
            }
            else {
                hunter.hunting.hunts.unsuccessful++;
            }
            hunter.save(); // save to the database
        }

        // embeds will be split to show results more clearly; start with header
        const embeds = [];

        // display tracked result
        embeds.push(new MessageEmbed({
            color: tracked ? 'GREEN' : 'RED',
            title: '🧭 ' + (tracked ? 'Tracked and spotted prey' : 'No prey has made itself known'),
            description: '**Territory Bonus**: +`' + trackProfName.toUpperCase() + '`/`2`'
            + '\n**Hunting DC**: `' + server.hunting.seasonDC + '`'
            + '\n\n**Rolled**: `' + trackRoll + '`/`20` + `' + trackProf + '`'
        }));

        // if tracked, display catch result
        if (tracked) embeds.push(new MessageEmbed({
            color: caught ? 'GREEN' : 'RED',
            title: '🪝 ' + (caught ? 'Caught and collected prey' : 'Unfortunately, the prey ran off'),
            description: '**Territory Bonus**: +`' + catchProfName.toUpperCase() + '`/`2`'
            + '\n**Hunting DC**: `' + server.hunting.seasonDC + '`'
            + '\n\n**Rolled**: `' + catchRoll + '`/`20` + `' + catchProf + '`'
        }));

        // attach final summary of the hunt
        embeds.push(new MessageEmbed({
            color: 'FUCHSIA',
            thumbnail: { url: tracked ? prey.visual : undefined },
            footer: {
                text: 'Hunt Results for ' + interaction.member.displayName,
                iconURL: interaction.member.displayAvatarURL()
            },
            description: generateBriefDescription(tracked, caught, preyFromLocations.descriptors[prey.size - 1], prey)
            + '\n\n' + (
                server.hunting.locked
                ? '🔒 **Hunting is currently restricted.**\n> `/eat` `/carry` and `/deposit` are unavailable.'
                : ('🍃 **This hunt is canon.**\n' + (tracked && caught ? '> You may use `/carry` to carry it on your back, and `/deposit` when you return to camp.\n> *You may also `/eat off-back` if you must without alerting others...*' : ''))
            ),
        }));

        // display results
        return interaction.editReply({
            embeds: embeds
        });

        // generates a brief summary of the hunt
        function generateBriefDescription(tracked, caught, preySizeDescriptor, prey) {

            // if not tracked then caught is not needed
            if (!tracked) return 'Unfortunately, it appears the ground below you is the only thing you see. No prey was located.';
    
            // construct brief summary
            const trackedHeader = 'Wandering in the distance, you see a rather **' + preySizeDescriptor + '** `' + prey.name.toUpperCase() + '`!';
            return trackedHeader + (
                caught
                ? '\nYou take it within your maw and tear into it, before pondering on what to do next.'
                : '\nHowever, before you can even lunge at it, it spots you, and rapidly flees the scene.'
            )
        }
    }

    /**
     * Set a user's recently caught to a prey
     * @param {BaseCommandInteraction} originalInteraction The original interaction
     * @param {string} userId The player who caught the prey
     * @param {prey} prey The prey that was caught
     * @returns {prey}
     */
    static setRecentlyCaught(interaction, userId, prey) {
        // clear prey if null
        if (!prey) {
            this.#playerIdToRecentlyCaught.delete(userId);
            return {prey: null, interaction: null};
        }

        // set recently caught
        this.#playerIdToRecentlyCaught.set(userId, {prey, interaction});
        console.log("UPDATED RECENTLY CAUGHT");
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
     * @param {BaseCommandInteraction} originalInteraction The original interaction
     * @returns {Array} [`AbleToAdd`, `WeightCarried`, `CurrentlyCarrying`]
     */
    static addToCarry(userId, prey, originalInteraction) {

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
        this.setRecentlyCaught(null, userId, null);
        console.log(inventory);
        console.log(this.#playerIdToInventory.get(userId));

        // swap interaction sidebar to grey if possible
        originalInteraction.fetchReply().then(r => {
            originalInteraction.editReply({
                embeds: [r.embeds[0]
                    .setColor('GREYPLE')
                    .setAuthor({
                        name: '🐾 Prey was carried away',
                        iconURL: originalInteraction.member.displayAvatarURL() })
                    .setTitle('')
                    .setThumbnail(r.embeds[0].image?.url || '')
                    .setImage('')
                    .setDescription('🍃')
                    .setFooter({ text: '' }),
                ]
            });
        }).catch(() => console.log("Original interaction may have been timed out or deleted."));
        
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