const { BaseCommandInteraction, MessageEmbed, MessagePayload, Message, ThreadManager } = require('discord.js');
const serverSchema = require('../../database/schemas/server');
const CoreUtil = require('../CoreUtil');
const flairs = require('./preyPileFlairs.json');

/**@typedef {'unforgiven'|'riverclan'|'shadowclan'|'thunderclan'} clans */


class PreyPile extends CoreUtil {

    /**
     * Associate a channel for a prey pile
     * @param {BaseCommandInteraction} interaction Discord interaction
     * @param {serverSchema} server Server database entry
     * @param {clans} clan The clan to modify
     */
    static async setPreyPileChannelAndSpawn(interaction, server, clan) {
        console.log({clan});

        // if channel being set is unique, set to the database
        if (server.clans[clan].preyPileChannelId ?? 0 != interaction.channel.id) {
            // if original channel is deleted, use the current
            server.clans[clan].preyPileChannelId = interaction.channel.id;
        }

        // if message is missing, spawn and set the id to the clan's entry
        /**@type {Message} */
        let spawnedMessage = await interaction.channel.messages.fetch(server.clans[clan].preyPileMessageId).catch(() => false);
        if (!server.clans[clan].preyPileMessageId
        || !spawnedMessage) {
            spawnedMessage = await this.spawnPreyPile(interaction, server, clan);
            server.clans[clan].preyPileMessageId = spawnedMessage.id;
        }

        // if thread is missing, spawn and set the id to the clan's entry
        /**@type {ThreadManager} */
        let spawnedThread = await spawnedMessage.channel.threads.fetch(server.clans[clan].preyPileThreadId).catch(() => false);
        if (!server.clans[clan].preyPileThreadId
        || !spawnedThread) {
            await spawnedMessage.delete().catch();
            spawnedMessage = await this.spawnPreyPile(interaction, server, clan);
            server.clans[clan].preyPileMessageId = spawnedMessage.id;

            // spawn thread
            spawnedThread = await spawnedMessage.startThread({
                name: 'prey-pile-updates',
                autoArchiveDuration: 60,
                reason: 'To keep track of deposited and eaten food.',
                startMessage: spawnedMessage
            });
            server.clans[clan].preyPileThreadId = spawnedThread.id;
        }

        // set clans as modified
        server.markModified(`clans.${clan}`);
        return { spawnedMessage, spawnedThread };
    }

    /**
     * Spawn a new prey pile.
     * @param {BaseCommandInteraction} interaction Discord interaction
     * @param {serverSchema} server Server database entry
     * @param {clans} clan The clan to modify
     */
    static async spawnPreyPile(interaction, server, clan) {
        const pile = new MessageEmbed()
            .setColor(flairs[clan].color)
            .setTitle(flairs[clan].flair + ` ${clan.toUpperCase()} PREY PILE`)
            .setDescription('__(`Bites Left` / `Size`) **Prey Type**__\n**- - - - - -**\n'
            + this.formatPrey(server.clans[clan].preyPile));
        return await interaction.channel.send({
            embeds:[pile]
        });
    }

    /**
     * Push a message to the server
     * @param {BaseCommandInteraction} interaction Original Discord interaction.
     * @param {serverSchema} server The server database entry.
     * @param {clans} clan The clan to send it to.
     * @param {MessagePayload} messagePayload The desired message to send.
     * @returns 
     */
    static async pushPreyUpdateMessage(interaction, server, clan, messagePayload) {
        const clanEntry = server.clans[clan];
        const channel = await interaction.guild.channels.fetch(clanEntry.preyPileChannelId).catch(() => false);
        if (!channel) {
            await this.SafeReply(interaction, {
                content: `⚠️ PLEASE NOTIFY AN ADMIN: ${clan.toUpperCase()}'s prey pile channel has not been initialized or has been deleted.`
            });
            return false;
        }
        // const message = await channel.messages

        let thread = await channel.threads.fetch(clanEntry.preyPileThreadId).catch(() => false);
        if (!thread) {
            // if parent channel was found, re-create and spawn
            let {spawnedThread} = await this.setPreyPileChannelAndSpawn(interaction, server, clan);
            thread = spawnedThread;
        }

        return await thread.send(messagePayload);
    }

    /**
     * Update the prey pile file if needed
     * @param {BaseCommandInteraction} interaction Discord interaction
     * @param {serverSchema} server Server database entry
     * @param {clans} clan The clan's prey pile to update
     * @returns {Promise<boolean>} True if successful update | False if channel or message is missing
     */
    static async updatePreyPile(interaction, server, clan) {
        const clanEntry = server.clans[clan];
        const channel = await interaction.guild.channels.fetch(clanEntry.preyPileChannelId).catch(() => false);
        if (!channel) {
            await this.SafeReply(interaction, {
                content: `⚠️ PLEASE NOTIFY AN ADMIN: ${clan.toUpperCase()}'s prey pile channel has not been initialized or has been deleted.`
            });
            return false;
        }

        // get message snowflake or spawn a new one if deleted
        let message = await channel?.messages?.fetch(clanEntry.preyPileMessageId).catch(() => false);
        if (!message) message = await this.setPreyPileChannelAndSpawn(interaction, server, clan);

        // create new pile and update existing message
        const pile = new MessageEmbed()
            .setColor(flairs[clan].color)
            .setTitle(flairs[clan].flair + ` ${clan.toUpperCase()} PREY PILE`)
            .setDescription('__(`Bites` / `Total Bites`) Prey Name__\n'
            + this.formatPrey(server.clans[clan].preyPile));
        return await message.edit({
            embeds:[pile]
        });
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

        // mark to save
        server.markModified(`clans.${clan}`);

        return pile;
    }
    
    /**
     * Get the current prey pile of a clan.
     * @param {clans} clan The clan's prey pile to peek at.
     * @param {serverSchema} server Current server's database entry.
     * @return {prey[]}
     */
    static getPreyPile(clan, server) {
        return server.clans[clan].preyPile;
    }

    /**
     * Pull a wanted amount from the prey pile.
     * @param {clans} clan The clan's prey pile to take and how much.
     * @param {serverSchema} server Current server's database entry.
     * @param {number} bitesToSatisfy The amount of bites needed to satisfy hunger.
     * @returns {{bites_taken: number, consumed: {name:string, totalEaten:number}[]}} The prey that was required to facilitate 
     */
    static pullFromPreyPile(clan, server, bitesToSatisfy) {
        const preyPile = server.clans[clan].preyPile;

        // iterate through the pile until prey is depleted or bites satisfied
        /**@type {prey} */
        let pulled = null;
        let bites_taken = 0;
        let total_bites_taken = 0;
        let eatenPrey = new Map();
        while (preyPile.length > 0 && bitesToSatisfy > 0) {

            // unenqueue prey item
            pulled = preyPile[0];
            console.log({pulled});
            
            // see how many bites needed; either the full thing or bites needed to satisfy
            const originalBitesRemaining = pulled.bites_remaining;
            bites_taken = Math.min(pulled.bites_remaining, bitesToSatisfy);
            pulled.bites_remaining -= bites_taken;
            bitesToSatisfy -= bites_taken;
            total_bites_taken += bites_taken;

            // if bites are left in the current pulled prey, re-add to the prey pile
            if (pulled.bites_remaining < 1)
                preyPile.shift();
            
            // record to eaten prey
            eatenPrey.set(
                pulled.name,
                (eatenPrey.get(pulled.name) || 0)
                    + 1 * (bites_taken / originalBitesRemaining)
            );

        }

        // format the prey eaten and update the prey pile if necessary
        console.log(eatenPrey);
        const eaten = Array.from(eatenPrey.entries()).map(([p, count]) => { return {name: p, amountEaten: count} })
        if (eaten.length > 0) {
            server.markModified(`clans.${clan}`);
        }
        
        // return the prey needed to eat
        return { bitesTaken: total_bites_taken, consumed: eaten };

    }

    static formatPrey(preyList) {
        // count the total weight in the prey list
        let totalWeight = 0;
        for (let i = 0; i < preyList.length; i++) {
            totalWeight += preyList[i].bites_remaining;
        }
        
        // return a formatted string with bites left out of the total size
        let charCount = 0;
        let preyCount = 0;
        let returnString;
        return preyList.map(p => {

            // decorate the string with the prey bites-remaining information
            returnString = `↣ **(\`${p.bites_remaining}\` / \`${p.size}\`) ${this.ProperCapitalization(p.name)}**`

            // count the total prey if within embed character limit
            if (charCount < 1500) {
                charCount += returnString.length;
                preyCount++;
                return returnString;
            }

        }).slice(0, preyCount).join('\n') + (charCount >= 1500 ? '...\n' : '\n')
        + (charCount >= 1500 ? '[`' + (preyList.length - preyCount) + '` more]' : '')
        + `\n**- - - - - -**\nTotal Available Bites to Eat: \`${totalWeight}\``;
    }
}

module.exports = PreyPile;