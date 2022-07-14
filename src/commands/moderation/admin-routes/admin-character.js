const { CommandInteraction, MessageEmbed } = require('discord.js');
const CharacterModel = require('../../../database/schemas/character');
const SubmissionHandler = require('../../../util/Submissions/SubmissionHandler');
const CoreUtil= require('../../../util/CoreUtil');


/**
 * @param {CommandInteraction} interaction 
 * @param {string} subcommand 
 */
module.exports = async (interaction, subcommand) => {

    // route subcommand
    switch (subcommand) {
        case 'delete': {
            // fetch character
            const author = interaction.options.getMember('character-author');
            const server = CoreUtil.Servers.cache.get(interaction.guild.id);
            const character = CoreUtil.Characters.cache.get(interaction.guild.id, author.user.id);

            // clear any submissions linked to this character
            if (SubmissionHandler.getSubmissionMessageId(server, character.userId))
                SubmissionHandler.removeSubmission(server, character.userId);

            // delete from the database
            CharacterModel.findOneAndDelete({ _id: character.id }).then(console.log).catch(console.error);
            CoreUtil.Characters.cache.remove(character.guildId, character.userId);

            // inform administrator that the character was deleted
            return interaction.reply({
                embeds: [new MessageEmbed({
                    color: 'RED',
                    title: '🗑️ ' + (character.name || (author.displayName + '\'s unnamed character')) + ' was permanently deleted.',
                })]
            })
        }
    }
}