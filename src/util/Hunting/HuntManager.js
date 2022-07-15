const serverSchema = require('../../database/schemas/server');
const preyFromLocations = require('./prey.json');
const huntChecks = require('./huntChecks.json');
const MemberModel = require('../../database/schemas/member');
const CharacterModel = require('../../database/schemas/character');
const { MessageEmbed, CommandInteraction, GuildMember, MessageActionRow, MessageButton, Message } = require('discord.js');
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
    static #Random = (min, max) => { return Math.floor(Math.random() * (max - min + 1) + min) };

    /**
     * @type {Map<guildId, Map<messageId, prey>>}
     * Player ID to their recently caught prey */
    static #recentlyCaught = new Map();

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

        // build buttons
        const rowOne = new MessageActionRow();
        if (tracked && caught) rowOne.addComponents([
            new MessageButton({
                customId: 'PREY:COLLECT',
                label: 'Collect',
                emoji: '🎒',
                style: 'SUCCESS',
            }),
            new MessageButton({
                customId: 'PREY:SHARE',
                label: 'Share',
                style: 'SECONDARY',
            }),
            new MessageButton({
                customId: 'PREY:EAT',
                label: 'Eat Secretly',
                style: 'DANGER',
            }),
        ]);

        // display results
        return this.SafeReply(interaction, { embeds, components: [rowOne] }).then(async () => {
            // add to recently caught if tracked and caught
            if (!tracked || !caught) return;
            const message = await interaction.fetchReply();
            HuntManager.setRecentlyCaught(message, interaction.member, interaction.guild.id, prey);
        });

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
     * @param {Message} message The original interaction's message
     * @param {GuildMember} originalMember The player who caught the prey
     * @param {string} guildId The guild in which it was caught in
     * @param {prey} prey The prey that was caught
     * @returns {prey}
     */
    static setRecentlyCaught(message, originalMember, guildId, prey) {

        // instantiate server if not already
        if (!this.#recentlyCaught.has(guildId)) this.#recentlyCaught.set(guildId, new Map());

        // get server recently caught
        const server = this.#recentlyCaught.get(guildId);

        // clear prey if null
        if (!prey) {
            server.delete(message.id);
            return {prey: null, message: null};
        }

        // set recently caught
        server.set(message.id, {prey, message, originalMember});
        console.log("UPDATED RECENTLY CAUGHT");
        console.log({ serverRecentlyCaught: server });
        return prey;
    }
    
    /**
     * Get the user's most recently caught prey item
     * @param {string} guildId The guild the player is in
     * @param {string} messageId The message the prey is held in
     * @returns {{prey: prey, message: Message, originalMember: GuildMember}}
     */
    static getRecentlyCaught(guildId, messageId) {
        const server = this.#recentlyCaught.get(guildId);
        if (!server) return null;
        
        return server.get(messageId) ?? null;
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