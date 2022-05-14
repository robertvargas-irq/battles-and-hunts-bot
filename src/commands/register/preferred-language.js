const FILE_LANG_ID = 'PREFERRED_LANGUAGE';

const { ApplicationCommandOptionType: dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const CoreUtil = require('../../util/CoreUtil');
const Language = require('../../util/Language');
const Translator = require('../../util/Translator');

module.exports = {
    name: 'preferred-language',
    description: 'Have the bot respond to you in your preferred language!',
    options: [
        {
            type: dTypes.String,
            name: 'language',
            description: 'Which language would you like the bot to respond in?',
            required: true,
            choices: [
                {
                    name: 'English',
                    value: Language.Languages.English,
                },
                {
                    name: 'Spanish',
                    value: Language.Languages.Spanish,
                },
                {
                    name: 'Portuguese',
                    value: Language.Languages.Portuguese,
                },
                {
                    name: 'Polish',
                    value: Language.Languages.Polish,
                }
            ]
        }
    ],
    /**@param {BaseCommandInteraction} interaction */
    async execute( interaction ) {
        
        // defer
        await interaction.deferReply({ ephemeral: false });
        
        // fetch user
        const found = await CoreUtil.FetchUser(interaction.user.id);
        if (!found) return CoreUtil.NotRegistered(interaction);
        
        // change preferred language and cache
        const preferred = interaction.options.getString('language');
        found.preferredLanguage = preferred;
        Language.SetLanguage(found);

        // save to database
        await found.save();

        // create translator
        const translator = new Translator(found.userId, FILE_LANG_ID);

        // show success message
        interaction.editReply({
            embeds: [
                new MessageEmbed()
                    .setColor('AQUA')
                    .setTitle('🌟 ' + translator.get('LANGUAGE_UPDATE_TITLE'))
                    .setDescription(translator.getGlobal('MENU_DISMISS')),
            ]
        });
    },
};