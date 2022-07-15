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
            Player.clearEditing(interaction.guild.id);
            return interaction.reply({
                embeds: [new MessageEmbed({
                    color: 'GREEN',
                    title: '🔐 All `/edit` usage has been re-locked.',
                    description: 'To grant individual access to `/edit`, use the `unlock` subcommand.'
                    + '\n/admin stats unlock'
                })]
            })
        }

        case 'unlock': {
            // add to unrestricted editing set
            const member = interaction.options.getMember('user');
            Player.allowEditing(interaction.guild.id, member.user.id);
            return interaction.reply({
                embeds: [new MessageEmbed({
                    color: 'GREEN',
                    title: '🔓 /edit permission has been temporarily granted to ' + member.displayName + '(' + member.user.tag + ').',
                    description: 'To lock everyone\'s usage of /edit again, use the `lock` subcommand.'
                    + '\n/admin stats lock'
                })]
            })
        }
    }
}