const { ApplicationCommandOptionType : CommandTypes } = require('discord-api-types/v10');
const { CommandInteraction, MessageEmbed, GuildMember } = require('discord.js');
const CharacterMenu = require('../../util/CharacterMenu/CharacterMenu');
const Player = require('../../util/Account/Player');
const CoreUtil = require('../../util/CoreUtil');

module.exports = {
    name: 'character',
    description: 'Customize your character, or check out another\'s!',
    options: [{
        name: 'player',
        description: '(DEFAULT: YOURSELF) View a full character profile of another!',
        type: CommandTypes.User,
        required: false,
    }],
    /**@param {CommandInteraction} interaction */
    async execute(interaction) {

        // fetch target's character
        const target = interaction.options.getMember('player', false) || interaction.member;
        const character = CoreUtil.Characters.cache.get(target.guild.id, target.user.id);

        // instantiate character menu and display to user
        const menu = new CharacterMenu(
            interaction,
            target,
            character,
            true,
            !Player.allowedToEdit(interaction.guild.id, interaction.user.id)
        );
        return menu.render();

    }
}