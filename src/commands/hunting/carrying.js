const HuntManager = require('../../util/Hunting/HuntManager')
const { CommandInteraction } = require('discord.js');
const HuntInventory = require('../../util/Hunting/HuntInventory');

module.exports = {
    name: 'carrying',
    description: 'Check what you are currently carrying from a hunt!',
    /**
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {

        // get user and server from the cache
        const hunter = HuntManager.Characters.cache.get(interaction.guild.id, interaction.user.id);
        if (!hunter || !hunter.approved) return HuntManager.NotRegistered(interaction);
        const server = HuntManager.Servers.cache.get(interaction.guild.id);

        // if hunting is currently restricted, display warning
        if (server.hunting.locked) return HuntManager.displayRestrictedHunting(interaction);
        
        // display inventory
        const [weightCarrying, preyCarrying] = HuntManager.getCarrying(interaction.user.id);
        return interaction.reply({
            ephemeral: true,
            embeds: [HuntInventory.generateCarryingEmbed(preyCarrying, weightCarrying)]
        });

    }
}