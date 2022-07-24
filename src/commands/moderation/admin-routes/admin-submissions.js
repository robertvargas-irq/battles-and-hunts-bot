const { CommandInteraction, EmbedBuilder, Colors } = require('discord.js');
const CharacterModel = require('../../../database/schemas/character');
const SubmissionHandler = require('../../../util/Submissions/SubmissionHandler');
const SubmissionAllowedMenu = require('../../../util/Submissions/SubmissionAllowedMenu');
const CoreUtil= require('../../../util/CoreUtil');


/**
 * @param {CommandInteraction} interaction 
 * @param {string} subcommand 
 */
module.exports = async (interaction, subcommand) => {
    
    // fetch server
    const server = CoreUtil.Servers.cache.get(interaction.guild.id);
    
    // route subcommand
    switch (subcommand) {
        case 'allowed-age-groups': {
            const allowedMenu = new SubmissionAllowedMenu(interaction, server);
            return allowedMenu.render();
        }
    }
}