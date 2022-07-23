const { CommandInteraction, EmbedBuilder } = require('discord.js');
const CoreUtil = require('../../util/CoreUtil');
const HungerVisuals = require('../../util/Hunting/HungerVisuals');

module.exports = {
    name: 'hunger',
    description: 'Quickly view your hunger!',
    /**@param {CommandInteraction} interaction */
    async execute(interaction) {
        
        // if user is registered
        const found = CoreUtil.Characters.cache.get(interaction.guild.id, interaction.user.id);
        if (!found || !found.approved) return CoreUtil.NotRegistered(interaction);

        // show hunger bar
        interaction.reply({
            embeds: [HungerVisuals.generateHungerEmbed(interaction.member, found)]
        });
    
    },
};