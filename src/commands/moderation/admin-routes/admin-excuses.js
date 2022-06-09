const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const ExcuseHandler = require('../../../util/Excused/ExcuseHandler');


/**
 * @param {BaseCommandInteraction} interaction 
 * @param {string} subcommand 
 */
module.exports = async (interaction, subcommand) => {

    // day shared among each subcommand
    const day = interaction.options.getString('day');

    // route subcommand
    switch (subcommand) {
        case 'clear': {
            await interaction.deferReply();
            const { deletedCount } = await ExcuseHandler.clearDayAndDeleteThread(interaction, day);

            // if nothing was deleted, inform and do not resume
            if (deletedCount === 0) return interaction.editReply({
                embeds: [new MessageEmbed({
                    color: 'AQUA',
                    title: '✨ All clean already-!',
                    description: '> Nothin\' needed to be deleted, and all remains as it was.'
                })]
            });

            // resume and inform success
            ExcuseHandler.resume(interaction, day);
            return interaction.editReply({
                embeds: [new MessageEmbed({
                    color: 'GREEN',
                    title: '✅ Successfully cleared ' + deletedCount + ' excuse(s) for ' + day,
                    description: '> Additionally, if excuses for this day were paused, they have been resumed.'
                })]
            });
        } // end clear

        case 'pause': {
            const successfullyPaused = ExcuseHandler.pause(interaction.guild.id, day);
            
            // paused successfully
            if (successfullyPaused) interaction.editReply({
                embeds: [new MessageEmbed({
                    color: 'GREEN',
                    title: '⏸ Successfully paused requests for ' + day,
                    description: 'To un-pause, use the `unpause` subcommand.\n/admin excuses unpause'
                })]
            });

            // already paused
            else interaction.editReply({
                embeds: [new MessageEmbed({
                    color: 'AQUA',
                    title: '⏸ Requests were already paused for ' + day,
                    description: 'To un-pause, use the `unpause` subcommand.\n/admin excuses unpause'
                })]
            });
        }

        case 'unpause': {
            const successfullyResumed = ExcuseHandler.resume(interaction.guild.id, day);
            
            // resumed successfully
            if (successfullyResumed) interaction.editReply({
                embeds: [new MessageEmbed({
                    color: 'GREEN',
                    title: '▶️ Successfully un-paused requests for ' + day,
                    description: 'To pause, use the `pause` subcommand.\n/admin excuses pause'
                })]
            });

            // already resumed
            else interaction.editReply({
                embeds: [new MessageEmbed({
                    color: 'AQUA',
                    title: '▶️ Requests were already un-paused for ' + day,
                    description: 'To pause, use the `pause` subcommand.\n/admin excuses pause'
                })]
            });
        }
    }

}