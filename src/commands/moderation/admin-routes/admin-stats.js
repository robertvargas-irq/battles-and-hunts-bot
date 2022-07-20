const { CommandInteraction, MessageEmbed, Permissions } = require('discord.js');
const Player = require('../../../util/Account/Player');


/**
 * @param {CommandInteraction} interaction 
 * @param {string} subcommand 
 */
module.exports = async (interaction, subcommand) => {

    // route subcommand
    switch (subcommand) {
        case 'lock': {
            // clear the set of users that are free to edit their stats
            Player.disallowGuildEditing(interaction.guild.id);
            Player.clearEditing(interaction.guild.id);
            return interaction.reply({
                embeds: [new MessageEmbed({
                    color: 'GREEN',
                    title: '🔐 Editing Stats in /character re-locked.',
                    description: 'To unlock individual or server-wide editing, use the `unlock-one` or `unlock-all` subcommand respectively.'
                    + '\n/admin stats unlock'
                })]
            })
        }

        case 'unlock-one': {
            // add to unrestricted editing set
            const member = interaction.options.getMember('user');
            Player.allowEditing(interaction.guild.id, member.user.id);
            return interaction.reply({
                embeds: [new MessageEmbed({
                    color: 'GREEN',
                    title: '🔓 Editing Stats in /character temporarily granted to ' + member.displayName + '(' + member.user.tag + ').',
                    description: 'To lock everyone\'s ability to edit /character Stats, use the `lock` subcommand.'
                    + '\n/admin stats lock'
                })]
            });
        }

        case 'unlock-all': {
            // add guild to unrestricted editing set
            Player.allowGuildEditing(interaction.guild.id);
            return interaction.reply({
                embeds: [new MessageEmbed({
                    color: 'GREEN',
                    title: '🔓 Editing Stats in /character granted to everyone within the server.',
                    description: 'To lock everyone\'s ability to edit /character Stats, use the `lock` subcommand.'
                    + '\n/admin stats lock'
                })]
            });
        }

    }
}