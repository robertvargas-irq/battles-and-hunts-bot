const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const firstTimeRegister = require('../../util/Account/firstTimeRegister');
const { formatStats } = require('../../util/Account/Player');
const CoreUtil = require('../../util/CoreUtil');
module.exports = {
    name: 'register',
    description: 'Register for the bot if you haven\'t already entered your stats!',
    /**@param {BaseCommandInteraction} interaction */
    async execute( interaction ) {

        // defer
        await interaction.deferReply({ ephemeral: true });
        
        // if user is registered
        let found = await CoreUtil.FetchUser(interaction.user.id);

        // prompt registration if user is not registered; inform if registered
        if (found) return alreadyRegistered(interaction, found);
        if (!found) found = await firstTimeRegister(interaction);
        if (!found) return; // error has already been handled inside collect()

        // show success message
        interaction.editReply({
            embeds: [
                new MessageEmbed()
                    .setColor('AQUA')
                    .setTitle('🌟 Your stats have been successfully saved!')
                    .setDescription('You may now dismiss this menu.'),
                formatStats(interaction, found)
            ]
        });
    },
};

/**
 * Inform the user they have already registered for the bot.
 * @param {BaseCommandInteraction} interaction
 */
function alreadyRegistered(interaction, userData) {
    interaction.editReply({
        embeds: [
            new MessageEmbed()
                .setColor('AQUA')
                .setTitle('🌟 You are already registered!')
                .setDescription(`
                If you want to attack another user during RP, use \`/attack\`!
                If you wish to edit your stats, use \`/edit\`!
                `),
            formatStats(interaction, userData)
        ]
    })
}