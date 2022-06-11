const FILE_LANG_ID = 'REGISTER'

const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const CharacterModel = require('../../database/schemas/character');
const MemberModel = require('../../database/schemas/member');
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
        let character = CoreUtil.Characters.cache.get(interaction.guild.id, interaction.user.id);
        let member = CoreUtil.Members.cache.get(interaction.guild.id, interaction.user.id);

        // prompt registration if user is not registered; inform if registered
        if (character && member) return alreadyRegistered(interaction, character, translator);
        character = await firstTimeRegister(interaction);
        if (!character) return; // error has already been handled inside collect()

        // add to language and character cache
        CoreUtil.Users.FetchOne(interaction.user.id).then(user => {
            Language.SetLanguage(user);
            console.log('User ' + user.userId + ' has had their language updated to ' + user.preferredLanguage);
        });

        // create member and cache if not already created
        if (!member) MemberModel.create({
            guildId: interaction.guild.id,
            userId: interaction.user.id,
        }).then((created) => CoreUtil.Members.cache.set(interaction.guild.id, interaction.user.id, created));

        // cache the newly created character
        CoreUtil.Characters.cache.set(interaction.guild.id, interaction.user.id, character);
        
        // show success message
        interaction.editReply({
            embeds: [
                new MessageEmbed()
                    .setColor('AQUA')
                    .setTitle('🌟 ' + translator.getGlobal('STATS_SAVED'))
                    .setDescription(translator.getGlobal('MENU_DISMISS')),
                ...Player.formatStats(interaction.member, character, interaction.user.id)
            ]
        });
    },
};

/**
 * Inform the user they have already registered for the bot.
 * @param {BaseCommandInteraction} interaction
 * @param {CharacterModel} character
 * @param {Translator} translator
 */
function alreadyRegistered(interaction, character, translator) {
    CoreUtil.SafeReply(interaction, {
        embeds: [
            new MessageEmbed()
                .setColor('AQUA')
                .setTitle('🌟 ' + translator.get('ALREADY_REGISTERED_TITLE'))
                .setDescription(translator.get('ALREADY_REGISTERED_DESCRIPTION')),
            ...Player.formatStats(interaction.member, character, interaction.user.id)
        ]
    })
}