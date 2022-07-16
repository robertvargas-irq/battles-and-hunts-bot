const { GuildMember, ButtonInteraction, MessageEmbed, Permissions, Message, MessageButton } = require('discord.js');
const CoreUtil = require('../../../../util/CoreUtil');
const ServerSchema = require('../../../../database/schemas/server');
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
            if (!authorId) return submissionNoLongerAvailable(button);
            const character = CoreUtil.Characters.cache.get(button.guild.id, authorId);
            if (!character) return characterNoLongerExists(button, server, authorId);
            /**@type {GuildMember}*/const authorMember = await button.guild.members.fetch(authorId).catch(() => false);
            if (!authorMember) return authorNoLongerInServer(button, server, authorId);

            // approve and save
            character.approved = true;
            character.save();

            // delete the thread
            safelyDeleteThread(button.message, 'Character was approved; Thread no longer needed.');

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
            authorMember.user.send({
                embeds: [new MessageEmbed({
                    color: 'GREEN',
                    title: '📝 Update on Recent Character Submission',
                    description: '> **Psst-! Your character in ' + button.guild.name + ' has been approved!\n\nGo check it out over at <#' + button.channel.id + '>!'
                })]
            }).then(console.log).catch(console.error);
            return;
        }

        case 'REFRESH': {
            // filter out non-admins
            if (!button.member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) return button.reply({
                ephemeral: true,
                embeds: [new MessageEmbed({
                    color: 'RED',
                    title: '⚠️ Only members with the `MANAGE_ROLES` permission can refresh submissions.',
                })],
            });

            // defer update
            button.deferUpdate();

            // get character from submission and refresh
            const server = CoreUtil.Servers.cache.get(button.guild.id);
            const authorId = SubmissionHandler.getSubmissionAuthorId(server, button.message.id);
            if (!authorId) return submissionNoLongerAvailable(button);
            const character = CoreUtil.Characters.cache.get(button.guild.id, authorId);
            if (!character) return characterNoLongerExists(button, server, authorId);
            const authorMember = await button.guild.members.fetch(authorId).catch(() => false);
            if (!authorMember) return authorNoLongerInServer(button, server, authorId);

            // refresh embed
            button.message.edit({
                embeds: [CharacterMenu.constructEmbed(character, authorMember)]
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
            if (!authorId) return submissionNoLongerAvailable(button);
            const character = CoreUtil.Characters.cache.get(button.guild.id, authorId);
            if (!character) return characterNoLongerExists(button, server, authorId);

            // delete the thread
            safelyDeleteThread(button.message, 'Submission was deleted; Thread no longer needed.');

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

/**
 * Delete a thread safely
 * @param {Message} message 
 */
async function safelyDeleteThread(message, reason = 'No reason provided,') {
    if (!message.hasThread) return;

    return message.thread.delete(reason)
        .then(() => console.log('Successfully deleted thread.'))
        .catch(e => {
            console.log('Unable to delete thread; Thread most likely no longer exists.');
            console.error(e);
        });
}

/**
 * Display error if submission no longer exists
 * @param {ButtonInteraction} button 
 */
async function submissionNoLongerAvailable(button) {
    return button.message.edit({
        embeds: [new MessageEmbed({
            color: 'RED',
            title: '⚠️ This character no longer exists.'
        })],
        components: [],
    });
}

/**
 * Display error if character no longer exists
 * @param {ButtonInteraction} button 
 * @param {ServerSchema} server 
 * @param {string} authorId 
 */
async function characterNoLongerExists(button, server, authorId) {
    SubmissionHandler.removeSubmission(server, authorId, button.message.id);
    safelyDeleteThread(button.message, 'Submission is no longer available; this character no longer exists.');
    return button.message.edit({
        embeds: [new MessageEmbed({
            color: 'RED',
            title: '⚠️ This character no longer exists.'
        })],
        components: [],
    });
}

/**
 * Display error if author is no longer in the server
 * @param {ButtonInteraction} button 
 * @param {ServerSchema} server 
 * @param {string} authorId 
 */
async function authorNoLongerInServer(button, server, authorId) {
    SubmissionHandler.removeSubmission(server, authorId, button.message.id);
    safelyDeleteThread(button.message, 'Submission is no longer available; member no longer in the server.');
    return button.message.edit({
        embeds: [new MessageEmbed({
            color: 'RED',
            title: '⚠️ This submission is no longer available as the member is no longer in the server.',
        })],
        components: [],
    });
}