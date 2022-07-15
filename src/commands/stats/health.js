const { CommandInteraction, MessageEmbed, Util: DiscordUtil } = require('discord.js');
const CoreUtil = require('../../util/CoreUtil');
const HealthVisuals = require('../../util/Battle/HealthVisuals');

module.exports = {
    name: 'health',
    description: 'Quickly view your health!',
    /**@param {CommandInteraction} interaction */
    async execute( interaction ) {
        
        // if user is registered
        const found = CoreUtil.Characters.cache.get(interaction.guild.id, interaction.user.id);
        if (!found || !found.approved) return CoreUtil.NotRegistered(interaction);

        // show health bar
        interaction.reply({
            embeds: [HealthVisuals.generateHealthEmbed(interaction.member, found)]
        });
    
    },
};