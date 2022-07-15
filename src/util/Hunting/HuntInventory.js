const { MessageEmbed, GuildMember, Message } = require("discord.js");
const HuntManager = require("./HuntManager");

class HuntInventory {

    static INVENTORY_MAX_WEIGHT = 7;

    /**
     * @type {Map<guildId, Map<userId, [weight: number, prey[]]>>}
     * Player ID to their inventory */
    static #inventories = new Map();

    /**
     * Pull from a player's carrying inventory
     * @param {[weight: number,prey[]]} inventory Player's inventory entry.
     * @param {number} bitesToSatisfy The amount of bites needed to satisfy hunger.
     * @returns {{bites_taken: number, consumed: {name:string, totalEaten:number}[]}} The prey that was required to facilitate 
     */
    static eatFromCarrying(inventory, bitesToSatisfy) {

        // iterate through the pile until prey is depleted or bites satisfied
        /**@type {prey} */
        let pulled = null;
        let bites_taken = 0;
        let total_bites_taken = 0;
        let eatenPrey = new Map();
        while (inventory[1].length > 0 && bitesToSatisfy > 0) {

            // unenqueue prey item
            pulled = inventory[1].shift();
            console.log({pulled});
            
            // see how many bites needed; either the full thing or bites needed to satisfy
            const originalBitesRemaining = pulled.bites_remaining;
            bites_taken = Math.min(pulled.bites_remaining, bitesToSatisfy);
            pulled.bites_remaining -= bites_taken;
            bitesToSatisfy -= bites_taken;
            total_bites_taken += bites_taken;
            
            // record to eaten prey
            eatenPrey.set(
                pulled.name,
                (eatenPrey.get(pulled.name) || 0)
                    + 1 * (bites_taken / originalBitesRemaining)
            );
        }

        // format the prey eaten
        console.log(eatenPrey);
        const eaten = Array.from(eatenPrey.entries()).map(([p, count]) => { return {name: p, amountEaten: count} })

        // return the prey needed to eat
        return { bitesTaken: total_bites_taken, consumed: eaten };

    }

    /**
     * Get all the items being carried
     * @param {string} guildId The guild this user is in
     * @param {string} userId The player's inventory to grab
     * @returns {[weight, prey[]]} All the prey in their inventory
     */
    static getCarrying(guildId, userId) {
        // instantiate server if not already
        if (!this.#inventories.has(guildId)) this.#inventories.set(guildId, new Map());

        // get server
        const server = this.#inventories.get(guildId);

        // if no inventory, instantiate
        if (!server.has(userId)) server.set(userId, [0, []]);

        // return inventory entry
        return server.get(userId);
    }

    /**
     * Add to a user's caught prey
     * @param {string} guildId The guild the user caught the prey
     * @param {string} userId The player to add to their carry
     * @param {prey} prey The prey to add to their carry
     * @param {Message} originalMessage The original interaction
     * @returns {[overEncumbered, weightCarrying, currentlyCarrying]} [`Over Encumbered`, `WeightCarried`, `CurrentlyCarrying`]
     */
    static addToCarry(guildId, userId, prey, originalMessage) {

        // get player inventory else create one
        const inventory = this.getCarrying(guildId, userId);
        const weight = inventory[0];
        const carried = inventory[1];

        // check if already over-encumbered
        if (weight > this.INVENTORY_MAX_WEIGHT)
            return [true, inventory[0], inventory[1]];
        
        // add to carried and increase weight
        carried.push(prey);
        inventory[0] = inventory[0] + prey.bites_remaining;

        // remove from recently caught
        HuntManager.setRecentlyCaught(originalMessage, null, guildId, null);
        console.log(inventory);

        // swap interaction sidebar to grey if possible
        originalMessage.edit({
            embeds: [originalMessage.embeds[0]
                .setColor('GREYPLE')
                .setTitle('')
                .setThumbnail(originalMessage.embeds[0].image?.url || '')
                .setDescription('')
                .setImage('')
                .setFooter({
                    text: '🐾 Prey was carried away',
                    iconURL: originalMessage.embeds[0].footer?.iconURL
                }),
            ],
            components: [],
        }).catch((e) => {
            console.log("Original message may have been deleted.")
            console.error(e);
        });
        
        // return over-encumbered status and new weight and inventory
        return [false, inventory[0], inventory[1]];
    }

    /**
     * Clear a player's inventory
     * @param {string} guildId The player's guild
     * @param {string} userId The player's inventory to delete
     * @returns {prey[]} All the prey in their inventory
     */
    static clearCarrying(guildId, userId) {

        // get inventory entry
        const inventory = this.getCarrying(guildId, userId);

        // cache inventory then empty player inventory
        const inventoryItems = inventory[1];
        this.setCarrying(guildId, userId, [0, []]);

        // return inventory entry
        return inventoryItems;
    }

    /**
     * Override a player's inventory
     * @param {string} guildId The player's guild
     * @param {string} userId The player to modify
     * @param {[weight: number, prey[]]} newInventory Inventory to replace the original
     * @returns {Map<userId, [weight: number, prey[]]>} New Map of player inventories
     */
    static setCarrying(guildId, userId, newInventory) {
        
        // instantiate server if not already
        if (!this.#inventories.has(guildId))
            this.#inventories.set(guildId, new Map());
        
        // get server
        const server = this.#inventories.get(guildId);

        // set inventory and return it
        return server.set(userId, newInventory);
    }



    /**
     * Generate an embed for what a character is carrying
     * @param {GuildMember} member 
     * @param {import("./HuntManager").prey[]} preyCarrying 
     * @param {number} weightCarrying
     */
    static generateCarryingEmbed(preyCarrying, weightCarrying) {
        return new MessageEmbed({
            color: 'BLURPLE',
            title: '🎒 Hunting Carrying Inventory',
            description: preyCarrying.length > 0
            ? '**Currently Carrying**\n' + HuntManager.formatPrey(preyCarrying)
            : '> Not currently carrying anything.\n\n⇸',
            fields: [
                {
                    name: '⚖️ Total Weight',
                    value: '`' + weightCarrying + '` / `' + HuntInventory.INVENTORY_MAX_WEIGHT + '`'
                }
            ]
        })
    }
}

module.exports = HuntInventory;