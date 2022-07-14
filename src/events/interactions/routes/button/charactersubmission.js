const { ButtonInteraction, MessageEmbed, Permissions, MessageButton } = require('discord.js');
const CoreUtil = require('../../../../util/CoreUtil');
const CharacterMenu = require('../../../../util/CharacterMenu/CharacterMenu');
const SubmissionHandler = require('../../../../util/Submissions/SubmissionHandler');


/** @param {ButtonInteraction} button */
module.exports = async (button) => {

    switch (button.customId.split(':')[1]) {
        case 'OPEN': {
            const character = CoreUtil.Characters.cache.get(button.guild.id, button.user.id);
            const menu = new CharacterMenu(button, button.member, character, true, false);
        
            // display to user
            await menu.render();
            if (character.approved) button.followUp({
                ephemeral: true,
                embeds: [new MessageEmbed({
                    color: 'GREEN',
                    title: '❗ Your character is already approved!',
                    description: '> However, here\'s the edit menu for you ❣️',
                })]
            });
            return;
        }

        case 'APPROVE': {
            // filter out non-admins
            if (!button.member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) return button.reply({
                ephemeral: true,
                embeds: [new MessageEmbed({
                    color: 'RED',
                    title: '⚠️ Only members with the `MANAGE_ROLES` permission can approve submissions.',
                })],
            });

            // defer update
            button.deferUpdate();

            // get character from submission and approve
            const server = CoreUtil.Servers.cache.get(button.guild.id);
            const authorId = SubmissionHandler.getSubmissionAuthorId(server, button.message.id);
            if (!authorId) return button.message.edit({
                embeds: [new MessageEmbed({
                    color: 'RED',
                    title: '⚠️ This submission is no longer available.',
                })],
                components: [],
            });
            const character = CoreUtil.Characters.cache.get(button.guild.id, authorId);
            if (!character) return button.message.edit({
                embeds: [new MessageEmbed({
                    color: 'RED',
                    title: '⚠️ This character no longer exists.'
                })],
                components: [],
            });
            character.approved = true;
            character.save();

            // mark message as approved and inform the author if possible
            SubmissionHandler.removeSubmission(server, authorId, button.message.id);
            button.message.edit({
                embeds: [new MessageEmbed(button.message.embeds[0])
                    .setColor('GREEN')
                    .setTitle(button.message.embeds[0].title + ' | ✅ APPROVED')
                    .setFooter({ text: 'Fulfilled by: ' + button.user.tag + ' (' + button.user.id + ')' })
                    .setTimestamp(),
                ],
                components: [],
            });
            return;
        }
        
        case 'DELETE': {
            // filter out non-admins
            if (!button.member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) return button.reply({
                ephemeral: true,
                embeds: [new MessageEmbed({
                    color: 'RED',
                    title: '⚠️ Only members with the `MANAGE_ROLES` permission can delete submissions.',
                })],
            });

            // defer update
            button.deferUpdate();

            // get character from submission and approve
            const server = CoreUtil.Servers.cache.get(button.guild.id);
            const authorId = SubmissionHandler.getSubmissionAuthorId(server, button.message.id);
            if (!authorId) return button.message.edit({
                embeds: [new MessageEmbed({
                    color: 'RED',
                    title: '⚠️ This submission is no longer available.',
                })],
                components: [],
            });
            const character = CoreUtil.Characters.cache.get(button.guild.id, authorId);
            if (!character) return button.message.edit({
                embeds: [new MessageEmbed({
                    color: 'RED',
                    title: '⚠️ This character no longer exists.'
                })],
                components: [],
            });

            // delete submission and inform author if possible
            SubmissionHandler.removeSubmission(server, authorId, button.message.id);
            button.message.edit({
                embeds: [new MessageEmbed({
                    description: '🗑️ Successfully deleted.',
                    footer: { text: 'Fulfilled by: ' + button.user.tag + ' (' + button.user.id + ')' },
                    timestamp: Date.now(),
                })],
                components: [],
            });
            return;
        }
    }
}