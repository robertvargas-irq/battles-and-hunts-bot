const { CommandInteraction, EmbedBuilder } = require('discord.js');
const ExcuseHandler = require('../../../util/Excused/ExcuseHandler');


/**
 * @param {CommandInteraction} interaction 
 * @param {string} subcommand 
 */
module.exports = async (interaction, subcommand) => {

    // day shared among each subcommand
    const day = interaction.options.getString('day');

    // route subcommand
    switch (subcommand) {
        case 'clear': {
            await interaction.deferReply();
            const server = ExcuseHandler.Servers.cache.get(interaction.guild.id);
            const { deletedCount } = await ExcuseHandler.clearDayAndDeleteThread(interaction, day);

            // re-render the menu
            ExcuseHandler.fetchMenuMessage(interaction, server).then(menuMessage => {
                if (!menuMessage) return;
                ExcuseHandler.renderMenu(menuMessage, server);
            });

            // if nothing was deleted, inform and do not resume
            if (deletedCount === 0) return interaction.editReply({
                embeds: [EmbedBuilder.from({
                    color: 'Aqua',
                    title: '✨ All clean already-!',
                    description: '> Nothin\' needed to be deleted, and all remains as it was.'
                })]
            });

            // resume and inform success
            ExcuseHandler.resume(interaction.guild.id, day);
            return interaction.editReply({
                embeds: [EmbedBuilder.from({
                    color: 'Green',
                    title: '✅ Successfully cleared ' + deletedCount + ' excuse' + (deletedCount != 1 ? 's' : '') + ' for ' + day,
                    description: '> Additionally, if excuses for this day were paused, they have been resumed.'
                })]
            });
        } // end clear

        case 'pause': {
            const server = ExcuseHandler.Servers.cache.get(interaction.guild.id);
            const successfullyPaused = ExcuseHandler.pause(interaction.guild.id, day);

            // re-render the menu
            ExcuseHandler.fetchMenuMessage(interaction, server).then(menuMessage => {
                if (!menuMessage) return;
                ExcuseHandler.renderMenu(menuMessage, server);
            });
            
            // paused successfully
            if (successfullyPaused) interaction.reply({
                embeds: [EmbedBuilder.from({
                    color: 'Green',
                    title: '⏸ Successfully paused requests for ' + day,
                    description: 'To un-pause, use the `unpause` subcommand.\n/admin excuses unpause'
                })]
            });

            // already paused
            else interaction.reply({
                embeds: [EmbedBuilder.from({
                    color: 'Aqua',
                    title: '⏸ Requests were already paused for ' + day,
                    description: 'To un-pause, use the `unpause` subcommand.\n/admin excuses unpause'
                })]
            });
            break;
        }

        case 'unpause': {
            const server = ExcuseHandler.Servers.cache.get(interaction.guild.id);
            const successfullyResumed = ExcuseHandler.resume(interaction.guild.id, day);
            
            // re-render the menu
            ExcuseHandler.fetchMenuMessage(interaction, server).then(menuMessage => {
                if (!menuMessage) return;
                ExcuseHandler.renderMenu(menuMessage, server);
            });

            // resumed successfully
            if (successfullyResumed) interaction.reply({
                embeds: [EmbedBuilder.from({
                    color: 'Green',
                    title: '▶️ Successfully un-paused requests for ' + day,
                    description: 'To pause, use the `pause` subcommand.\n/admin excuses pause'
                })]
            });

            // already resumed
            else interaction.reply({
                embeds: [EmbedBuilder.from({
                    color: 'Aqua',
                    title: '▶️ Requests were already un-paused for ' + day,
                    description: 'To pause, use the `pause` subcommand.\n/admin excuses pause'
                })]
            });
            break;
        }
    }

}