const serverSchema = require('../../database/schemas/server');
const preyFromLocations = require('./prey.json');
const huntChecks = require('./huntChecks.json');
const MemberModel = require('../../database/schemas/member');
const CharacterModel = require('../../database/schemas/character');
const { Collection, MessageEmbed, CommandInteraction, GuildMember, MessageButton, MessageActionRow } = require('discord.js');
const CoreUtil = require('../CoreUtil');

/**
 * Type definitions
 * @typedef {{
 * bites?: {min?: number, max?: number},
 * requiresTracking?: boolean,
 * requiresCatching?: boolean,
 * messages?: {
 *      tracked?: {
 *          success?: string,
 *          fail?: string,
 *      },
 *      caught?: {
 *          success?: string,
 *          fail?: string,
 *      },
 *      size?: string[]
 * },
 * }} overrides
 * @typedef {'unforgiven'|'riverclan'|'shadowclan'|'thunderclan'} clans
 * @typedef {{name: string, size: number, bites_remaining: number, overrides: overrides}} prey
 * @typedef {
 * 'outpost-rock'|'gorge'|'barn'|'snake-rocks'|'sandy-hollow'|'thunderpath'|'burnt-sycamore'|'pond'|'river'|'carrion-place'
 * } locations
 */


class HuntManager extends CoreUtil {
    static #MAX_HUNT_TIMERS = 5;
    static #MAX_DEPOSIT_TIMERS = 2;
    static #HUNT_COOLDOWN = (30 * 1000) // 30 seconds
    static #DEPOSIT_COOLDOWN = (30 * 60 * 1000) // 30 minutes
    static #Random = (min, max) => { return Math.floor(Math.random() * (max - min + 1) + min) };
    static #RandomFromArray = (a) => { return a[this.#Random(0, a.length - 1)] }
    
    /**
     * @type {Map<guildId, Map<userId, prey>>}
     * Player ID to their recently caught prey */
    static #recentlyCaught = new Map();

    /**
     * @type {Map<guildId, Map<userId, number[]>>}}
     * Map of 2 cooldown timers for /hunt */
    static #cooldownHunt = new Map();

    /**
     * @type {Map<guildId, Map<userId, number[]>>}}
     * Map of 2 cooldown timers for /deposit */
    static #cooldownDeposit = new Map();

    /**
     * Get user's cooldown timers for /hunt;
     * Remove cooldown if applicable
     * @param {string} guildId Guild user is in
     * @param {string} userId User to check for
     */
    static getCooldownHunt(guildId, userId) {
        // get server
        const server = this.#cooldownHunt.get(guildId);
        if (!server) return false;

        // get user timers
        const timers = server.get(userId);

        // if no cooldown at all
        if (!timers || !timers.length) return false;

        return timers;
    }

    /**
     * Get user's cooldown timers for /deposit;
     * Remove cooldown if applicable
     * @param {string} guildId Guild user is in
     * @param {string} userId User to check for
     */
    static getCooldownDeposit(guildId, userId) {
        // get server
        const server = this.#cooldownDeposit.get(guildId);
        if (!server) return false;

        // get user timers
        const timers = server.get(userId);

        // if no cooldown at all
        if (!timers || !timers.length) return false;

        return timers;
    }

    /**
     * Check to see if user is on cooldown for /hunt;
     * Remove cooldown if applicable
     * @param {string} guildId Guild user is in
     * @param {string} userId User to check for
     */
    static onCooldownHunt(guildId, userId) {

        // get server
        const server = this.#cooldownHunt.get(guildId);
        if (!server) return false;

        // get user timers
        const timers = server.get(userId);

        // if no cooldown at all
        if (!timers) return false;

        // if the queue is not full
        if (timers.length < this.#MAX_HUNT_TIMERS) return false;

        // if the front timer is satisfied, unqueue and return false
        if (Date.now() - timers[0] >= this.#HUNT_COOLDOWN) {
            if (timers.length <= 1) {
                server.delete(userId);
                if (server.size < 1) this.#cooldownHunt.delete(guildId);
            }
            else timers.shift();
            return false;
        }

        // all checks failed, not on cooldown
        return true;
    }

    /**
     * Check to see if user is on cooldown for /deposit;
     * Remove cooldown if applicable
     * @param {string} guildId Guild user is in
     * @param {string} userId User to check for
     */
    static onCooldownDeposit(guildId, userId) {

        // get server
        const server = this.#cooldownDeposit.get(guildId);
        if (!server) return false;

        // get user timers
        const timers = server.get(userId);

        // if no cooldown at all
        if (!timers) return false;

        // if the queue is not full
        if (timers.length < this.#MAX_DEPOSIT_TIMERS) return false;

        // if the front timer is satisfied, unqueue and return false
        if (Date.now() - timers[0] >= this.#DEPOSIT_COOLDOWN) {
            if (timers.length <= 1) {
                server.delete(userId);
                if (server.size < 1) this.#cooldownDeposit.delete(guildId);
            }
            else timers.shift();
            return false;
        }

        // all checks failed, not on cooldown
        return true;
    }

    /**
     * Add a cooldown for /hunt
     * @param {string} guildId Guild user is in
     * @param {string} userId The user ID to add to cooldown list
     */
    static addCooldownHunt(guildId, userId) {
        
        // instantiate server if not already
        if (!this.#cooldownHunt.has(guildId))
            this.#cooldownHunt.set(guildId, new Map());

        // get server
        const server = this.#cooldownHunt.get(guildId);

        // get user timers and push new one
        const timers = server.get(userId);
        if (timers)
            timers.push(Date.now());
        else server.set(userId, [Date.now()]);
        console.log(server);
    }

    /**
     * Add a cooldown for /deposit
     * @param {string} guildId Guild user is in
     * @param {string} userId The user ID to add to the cooldown list
     */
    static addCooldownDeposit(guildId, userId) {

        // instantiate server if not already
        if (!this.#cooldownDeposit.has(guildId))
            this.#cooldownDeposit.set(guildId, new Map());
        
        // get server
        const server = this.#cooldownDeposit.get(guildId);

        // get user timers and push new one
        const timers = server.get(userId);
        if (timers)
            timers.push(Date.now());
        else server.set(userId, [Date.now()]);
        console.log(server);
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
        const preyName = this.#RandomFromArray(preyFromLocations[location]);
        const overrides = preyFromLocations.overrides[preyName] || false;
        const sizeRoll = this.#Random(
            overrides?.bites?.min || 1,
            overrides?.bites?.max || maxSize
        );
        return {
            name: preyName,
            size: sizeRoll,
            bites_remaining: sizeRoll,
            visual: preyFromLocations.visuals[preyName],
            overrides,
        }
    }

    /**
     * Display the resulting rolls to the player.
     * @param {CommandInteraction} interaction
     * @param {CharacterModel} character Character information from the database.
     * @param {MemberModel} member Member information from the database.
     * @param {serverSchema} server Server information from the database. 
     * @param {clans} territory The current territory being hunted in.
     * @param {locations} location The location type within the territory being hunted in.
     * @param {number} trackRoll Result of a track roll.
     * @param {number} catchRoll Result of a catch roll.
     * @param {prey} prey The prey that would have been caught.
     */
    static generateAndDisplayResults(interaction, character, member, server, territory, location, trackRoll, catchRoll, prey) {
        // get proficiencies for current territory
        const [trackProfName, catchProfName] = huntChecks[territory];
        const trackProf = Math.floor(character.stats[trackProfName] / 2);
        const catchProf = Math.floor(character.stats[catchProfName] / 2);

        // check if the prey requires either to pass, and if DC's pass
        const tracked = prey.overrides?.hasOwnProperty('requiresTracking') && !prey.overrides?.requiresTracking ? true
        : trackRoll + trackProf >= server.hunting.seasonDC;
        const caught = prey.overrides?.hasOwnProperty('requiresCatching') && !prey.overrides?.requiresCatching ? true
        : catchRoll + catchProf >= server.hunting.seasonDC;

        // if hunting is not locked, and prey has been caught, add to recently caught and record results
        if (!server.hunting.locked) {
            if (tracked && caught) {
                this.setRecentlyCaught(interaction, interaction.guild.id, interaction.user.id, prey);
                character.hunting.hunts.successful++;
                member.hunting.hunts.successful++;
            }
            else {
                character.hunting.hunts.unsuccessful++;
                member.hunting.hunts.unsuccessful++;
            }

            // save updates to the database
            character.save();
            member.save();
        }

        // embeds will be split to show results more clearly; start with header
        const embeds = [];

        // display tracked result only if a track roll was required
        if (!prey.overrides?.hasOwnProperty('requiresTracking') || prey.overrides?.requiresTracking) embeds.push(new MessageEmbed({
            color: tracked ? 'GREEN' : 'RED',
            title: '🧭 ' + (tracked ? 'Tracked and spotted prey' : 'No prey has made itself known'),
            description: '**Territory Bonus**: +`' + trackProfName.toUpperCase() + '`/`2`'
            + '\n**Hunting DC**: `' + server.hunting.seasonDC + '`'
            + '\n\n**Rolled**: `' + trackRoll + '`/`20` + `' + trackProf + '`'
        }));

        // if tracked, display catch result only if a catch roll was required
        if ((!prey.overrides?.hasOwnProperty('requiresCatching') || prey.overrides?.requiresCatching) && tracked) embeds.push(new MessageEmbed({
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
                text: 'Hunt Results for ' + (character.name ?? interaction.member.displayName + '\'s character'),
                iconURL: character.icon ?? interaction.member.displayAvatarURL({ dynamic: true })
            },
            description: generateBriefDescription(tracked, caught, preyFromLocations.descriptors[prey.size - 1], prey)
            + '\n\n' + (
                server.hunting.locked
                ? '🔒 **Hunting is currently restricted.**\n> `/eat-from` `/carry` and `/deposit` are unavailable.'
                : ('🍃 **This hunt is canon.**\n' + (tracked && caught ? '> You may use `/carry` to carry it on your back, and `/deposit` when you return to camp.\n> *You may also `/eat-from back` to eat off the pile on your back if you must without alerting others...*' : ''))
            ),
        }));

        // // build buttons
        // const rowOne = new MessageActionRow();
        // if (tracked && caught) rowOne.addComponents([
        //     new MessageButton({
        //         customId: 'PREY:COLLECT',
        //         label: 'Collect',
        //         emoji: '🎒',
        //         style: 'SUCCESS',
        //     }),
        //     new MessageButton({
        //         customId: 'PREY:SHARE',
        //         label: 'Share',
        //         style: 'SECONDARY',
        //     }),
        //     new MessageButton({
        //         customId: 'PREY:EAT',
        //         label: 'Eat Secretly',
        //         style: 'DANGER',
        //     }),
        // ]);

        // display results
        return this.SafeReply(interaction, { embeds, components: [/*rowOne*/] });

        // generates a brief summary of the hunt
        function generateBriefDescription(tracked, caught, preySizeDescriptor, /**@type {prey} */ prey) {

            // if not tracked then caught is not needed
            if (!tracked) return prey.overrides?.messages?.tracked?.fail
            || 'Unfortunately, it appears the ground below you is the only thing you see. No prey was located.';

            // create a summary starting with the tracked description
            let message = prey.overrides?.messages?.tracked?.success
            || 'Wandering in the distance, you see a rather **' + preySizeDescriptor + '** `' + prey.name.toUpperCase() + '`!'
            
            // add size clarification
            message += '\n(Size in bites: `' + prey.size + '`)';

            // append the appropriate catch roll message
            message += '\n\n';
            if (caught) message += prey.overrides?.messages?.caught?.success
            || 'You take it within your maw and tear into it, before pondering on what to do next.'
            else message += prey.overrides?.messages?.caught?.fail
            || 'However, before you can even lunge at it, it spots you, and rapidly flees the scene.'

            return message;
        }
    }

    /**
     * Set a user's recently caught to a prey
     * @param {CommandInteraction} originalInteraction The original interaction
     * @param {string} guildId The guild in which it was caught in
     * @param {string} userId The player who caught the prey
     * @param {prey} prey The prey that was caught
     * @returns {prey}
     */
    static setRecentlyCaught(interaction, guildId, userId, prey) {

        // instantiate server if not already
        if (!this.#recentlyCaught.has(guildId)) this.#recentlyCaught.set(guildId, new Map());

        // get server recently caught
        const server = this.#recentlyCaught.get(guildId);

        // clear prey if null
        if (!prey) {
            server.delete(userId);
            return {prey: null, interaction: null};
        }

        // set recently caught
        server.set(userId, {prey, interaction});
        console.log("UPDATED RECENTLY CAUGHT");
        console.log({ serverRecentlyCaught: server });
        return prey;
    }
    
    /**
     * Get the user's most recently caught prey item
     * @param {string} guildId The guild the player is in
     * @param {string} userId The player who caught the prey
     * @returns {prey}
     */
    static getRecentlyCaught(guildId, userId) {
        const server = this.#recentlyCaught.get(guildId);
        if (!server) return null;
        
        return server.get(userId) ?? null;
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
        return Array.from(counter.entries()).map(([preyName, preyCount]) => {
            console.log(preyName, preyCount);
            return `↣ **(${preyCount}) ${this.ProperCapitalization(preyName)}**`
        }).join('\n');
    }

    /**
     * Display that hunting is currently restricted
     * @param {CommandInteraction} interaction Interaction to edit
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
     * @param {CommandInteraction} interaction Original Discord interaction
     */
    static async displayCooldownHunt(interaction) {
        let minutes = ((this.#HUNT_COOLDOWN - (Date.now() - this.getCooldownHunt(interaction.guild.id, interaction.user.id)[0])) / 60 / 1000).toFixed(1);
        return await this.SafeReply(interaction, {
            ephemeral: true,
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
     * @param {CommandInteraction} interaction Original Discord interaction
     */
    static async displayCooldownDeposit(interaction) {
        let minutes = ((this.#DEPOSIT_COOLDOWN - (Date.now() - this.getCooldownDeposit(interaction.guild.id, interaction.user.id)[0])) / 60 / 1000).toFixed(1);
        return await this.SafeReply(interaction, {
            ephemeral: true,
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
     * @param {CharacterModel} character User entry in the database
     * @param {GuildMember} memberSnowflake Member desired
     */
    static formatStats(character, memberSnowflake) {
        return new MessageEmbed({
            color: 'DARK_VIVID_PINK',
            thumbnail: { url: character.icon ?? memberSnowflake.displayAvatarURL({ dynamic: true }) },
            title: '🥩 Hunting Stats and Contributions',
            description: '**These are 🍃 canon contributions!**'
            + '\n*(These only update when Hunting is not `restricted`)*',
            fields: [
                {
                    name: 'Hunting',
                    value: 'Successful Hunts: `' + character.hunting.hunts.successful + '`'
                    + '\nUnsuccessful Hunts: `' + character.hunting.hunts.unsuccessful + '`'
                    + '\nSuccess/Fail Ratio: `' + ((character.hunting.hunts.successful + 1) / (character.hunting.hunts.unsuccessful + 1)).toFixed(2) + '`'
                },
                {
                    name: 'Contributions',
                    value: 'Total Prey Count: `' + character.hunting.contributions.preyCount + '`'
                    + '\nTotal Prey Weight: `' + character.hunting.contributions.preyWeight + '` `lbs.`'
                    + '\nAverage Prey Weight: `' + ((character.hunting.contributions.preyWeight + 1) / (character.hunting.contributions.preyCount + 1)).toFixed(2) + '`'
                },
                {
                    name: 'Hunting Trips',
                    value: '*(number of `/deposit`s)*'
                    + '\nTrips Made: `' + character.hunting.trips + '`'
                }
            ],
            footer: { text: character.name ?? memberSnowflake.displayName + '\'s character' },
        });
    }

}


module.exports = HuntManager;