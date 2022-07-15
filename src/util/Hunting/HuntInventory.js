const { MessageEmbed, GuildMember } = require("discord.js");
const HuntManager = require("./HuntManager");

class HuntInventory {

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
            description: preyCarrying.length > 1
            ? '**Currently Carrying**\n' + HuntManager.formatPrey(preyCarrying)
            : '> Not currently carrying anything.\n\n⇸',
            fields: [
                {
                    name: '⚖️ Total Weight',
                    value: '`' + weightCarrying + '` / `' + HuntManager.INVENTORY_MAX_WEIGHT + '`'
                }
            ]
        })
    }
}

module.exports = HuntInventory;