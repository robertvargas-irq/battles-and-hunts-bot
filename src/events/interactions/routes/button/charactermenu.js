const { ButtonInteraction, MessageEmbed } = require('discord.js');
const CharacterMenu = require('../../../../util/CharacterMenu/CharacterMenu');
const Player = require('../../../../util/Account/Player');

/** @param {ButtonInteraction} button */
module.exports = async (button) => {
    console.log('Route: ' + button.customId);

    const [_, action, editTarget] = button.customId.split(':');

    const active = await CharacterMenu.getActiveEdit(button);
    if (!active) return button.reply({
        ephemeral: true,
        content: '**This editor is no longer valid. Please open a new one if you wish to proceed.**'
        + '\n> This may have been caused by another editor being opened, or the bot having restarted.'
    });

    // ensure editing is valid
    if (!active.isAdmin && !Player.allowedToEdit(active.interaction.guild.id, active.interaction.user.id)
    && editTarget != 'INFO')
        return button.reply({
            embeds: [new MessageEmbed({
                title: '🔒 Your editing has been locked.'
            })]
        });
    return active.displayEditModal(button, editTarget);

}