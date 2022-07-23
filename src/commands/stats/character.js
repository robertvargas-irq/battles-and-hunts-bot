const { ApplicationCommandOptionType : CommandTypes } = require('discord-api-types/v10');
const { CommandInteraction } = require('discord.js');
const CharacterMenu = require('../../util/CharacterMenu/CharacterMenu');
const Player = require('../../util/Account/Player');
const CoreUtil = require('../../util/CoreUtil');

module.exports = {
    name: 'character',
    description: 'Customize your character, or check out another\'s!',
    options: [
        {
            name: 'player',
            description: '(DEFAULT: YOURSELF) View a full character profile of another!',
            type: CommandTypes.User,
            required: false,
        },
        {
            name: 'display-publicly',
            description: '(WILL DISABLE EDITING CONTROLS) Display this menu publicly!',
            type: CommandTypes.Boolean,
            required: false,
        },
    ],
    /**@param {CommandInteraction} interaction */
    async execute(interaction) {

        // ensure target is not a bot
        const target = interaction.options.getMember('player') || interaction.member;
        if (target.user.bot) return CoreUtil.denyBotInteraction(interaction);

        // get character from cache
        const character = CoreUtil.Characters.cache.get(target.guild.id, target.user.id);
        const displayingPublicly = interaction.options.getBoolean('display-publicly', false) ?? false;

        // if displaying publicly, send only an embed
        if (displayingPublicly) return interaction.reply({
            embeds: [
                CharacterMenu.iconEmbed(character, target),
                CharacterMenu.constructEmbed(character, target),
            ]
        });

        // instantiate character menu and display to user
        const menu = new CharacterMenu(
            interaction,
            target,
            character,
            true,
            !Player.allowedToEdit(interaction.guild.id, interaction.user.id),
        );
        return menu.render();

    }
}