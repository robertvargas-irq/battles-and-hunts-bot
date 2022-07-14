const { ButtonInteraction, MessageEmbed } = require('discord.js');
const CharacterMenu = require('../../../../util/CharacterMenu/CharacterMenu');
const SubmissionHandler = require('../../../../util/Submissions/SubmissionHandler');
const CoreUtil = require('../../../../util/CoreUtil');
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

    // route
    switch (action) {
        case 'SUBMIT': {
            const server = CoreUtil.Servers.cache.get(button.guild.id);
            if (active.character.approved) return button.reply({
                ephemeral: true,
                embeds: [new MessageEmbed({
                    color: 'YELLOW',
                    title: '⚠️ Woah wait-!',
                    description: '> It looks like this character has already been approved!'
                })]
            })
            return SubmissionHandler.handleSubmission(button, active.character, server);
        }
        case 'EDIT': {
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
    }


}