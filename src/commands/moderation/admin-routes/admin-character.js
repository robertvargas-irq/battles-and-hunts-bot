const { CommandInteraction, EmbedBuilder, Colors } = require('discord.js');
const CharacterModel = require('../../../database/schemas/character');
const SubmissionHandler = require('../../../util/Submissions/SubmissionHandler');
const CoreUtil= require('../../../util/CoreUtil');


/**
 * @param {CommandInteraction} interaction 
 * @param {string} subcommand 
 */
module.exports = async (interaction, subcommand) => {

    
    // filter bots
    const author = interaction.options.getMember('character-author');
    if (author.user.bot) return CoreUtil.denyBotInteraction(interaction);
    
    // fetch server and character
    const server = CoreUtil.Servers.cache.get(interaction.guild.id);
    const character = CoreUtil.Characters.cache.get(interaction.guild.id, author.user.id);
    if (!CoreUtil.Characters.cache.has(interaction.guild.id, author.user.id))
        CoreUtil.Characters.cache.set(interaction.guild.id, author.user.id, character);

    // clear any submissions linked to this character
    if (SubmissionHandler.getSubmissionMessageId(server, character.userId))
    SubmissionHandler.removeSubmission(server, character.userId);
    
    // route subcommand
    switch (subcommand) {
        case 'delete': {

            // delete from the database
            CharacterModel.findOneAndDelete({ _id: character.id }).then(console.log).catch(console.error);
            CoreUtil.Characters.cache.remove(character.guildId, character.userId);

            // inform administrator that the character was deleted
            return interaction.reply({
                embeds: [EmbedBuilder.from({
                    color: Colors.Red,
                    title: '🗑️ ' + (character.name || (author.displayName + '\'s unnamed character')) + ' was permanently deleted.',
                })]
            });
        }

        case 'approve': {
            
            // notify if already approved
            if (character.approved) return interaction.reply({
                ephemeral: true,
                embeds: [EmbedBuilder.from({
                    color: Colors.Fuchsia,
                    title: '💡 This character is already approved!',
                })]
            });

            // mark as approved and inform
            character.approved = true;
            character.save();
            return interaction.reply({
                embeds: [EmbedBuilder.from({
                    color: Colors.Green,
                    title: '✅ This character is now marked as approved!',
                })]
            });
        }

        case 'un-approve': {

            // notify if not approved already
            if (!character.approved) return interaction.reply({
                ephemeral: true,
                embeds: [EmbedBuilder.from({
                    color: Colors.Fuchsia,
                    title: '💡 This character is not approved yet!',
                })]
            });

            // mark as not approved and inform
            character.approved = false;
            character.save();
            return interaction.reply({
                embeds: [EmbedBuilder.from({
                    color: Colors.Green,
                    title: '✅ This character is no longer marked as approved!',
                })]
            });
        }
    }
}