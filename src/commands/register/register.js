const FILE_LANG_ID = 'REGISTER'

const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const userSchema = require('../../database/schemas/user');
const firstTimeRegister = require('../../util/Account/firstTimeRegister');
const Player = require('../../util/Account/Player');
const CoreUtil = require('../../util/CoreUtil');
const Language = require('../../util/Language');
const Translator = require('../../util/Translator');

module.exports = {
    name: 'register',
    description: 'Register for the bot if you haven\'t already entered your stats!',
    /**@param {BaseCommandInteraction} interaction */
    async execute( interaction ) {

        // defer
        await interaction.deferReply({ ephemeral: true });

        // create translator
        const translator = new Translator(interaction.user.id, FILE_LANG_ID);
        
        // if user is registered
        let found = await CoreUtil.FetchUser(interaction.user.id);

        // prompt registration if user is not registered; inform if registered
        if (found) return alreadyRegistered(interaction, found, translator);
        if (!found) found = await firstTimeRegister(interaction);
        if (!found) return; // error has already been handled inside collect()

        // add to language cache
        Language.SetLanguage(found);

        // show success message
        interaction.editReply({
            embeds: [
                new MessageEmbed()
                    .setColor('AQUA')
                    .setTitle('🌟 ' + Translator.getGlobal('STATS_SAVED'))
                    .setDescription(Translator.getGlobal('MENU_DISMISS')),
                Player.formatStats(interaction.member, found, interaction.user.id)
            ]
        });
    },
};

/**
 * Inform the user they have already registered for the bot.
 * @param {BaseCommandInteraction} interaction
 * @param {userSchema} userData
 * @param {Translator} translator
 */
function alreadyRegistered(interaction, userData, translator) {
    interaction.editReply({
        embeds: [
            new MessageEmbed()
                .setColor('AQUA')
                .setTitle('🌟 ' + translator.get('ALREADY_REGISTERED_TITLE'))
                .setDescription(translator.get('ALREADY_REGISTERED_DESCRIPTION')),
            Player.formatStats(interaction.member, userData, interaction.user.id)
        ]
    })
}