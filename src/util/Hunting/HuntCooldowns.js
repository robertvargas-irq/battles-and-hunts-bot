const { MessageEmbed, CommandInteraction } = require('discord.js');
const CoreUtil = require('../CoreUtil');

class HuntCooldowns {

    static #MAX_HUNT_TIMERS = 5;
    static #MAX_DEPOSIT_TIMERS = 2;

    static HUNT_COOLDOWN = (30 * 1000) // 30 seconds
    static DEPOSIT_COOLDOWN = (30 * 60 * 1000) // 30 minutes

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
        if (Date.now() - timers[0] >= this.HUNT_COOLDOWN) {
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
        if (Date.now() - timers[0] >= this.DEPOSIT_COOLDOWN) {
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
     * Display that the user is on cooldown for /hunt
     * @param {CommandInteraction} interaction Original Discord interaction
     */
     static async displayCooldownHunt(interaction) {
        let minutes = ((HuntCooldowns.HUNT_COOLDOWN - (Date.now() - this.getCooldownHunt(interaction.guild.id, interaction.user.id)[0])) / 60 / 1000).toFixed(1);
        return await CoreUtil.SafeReply(interaction, {
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
        let minutes = ((HuntCooldowns.DEPOSIT_COOLDOWN - (Date.now() - this.getCooldownDeposit(interaction.guild.id, interaction.user.id)[0])) / 60 / 1000).toFixed(1);
        return await CoreUtil.SafeReply(interaction, {
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
}

module.exports = HuntCooldowns;