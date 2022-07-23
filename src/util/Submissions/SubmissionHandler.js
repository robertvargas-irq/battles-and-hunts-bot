const {
    Message,
    CommandInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const ServerSchema = require('../../database/schemas/server');
const CharacterMenu = require('../CharacterMenu/CharacterMenu');
const CharacterModel = require('../../database/schemas/character');
const CoreUtil = require('../CoreUtil');

class SubmissionHandler {

    /**
     * Handle incoming submission
     * @param {CommandInteraction} interaction 
     * @param {CharacterModel} character 
     * @param {ServerSchema} server
     */
    static async handleSubmission(interaction, character, server) {
        const channel = await this.fetchProcessingChannel(interaction, server);
        // // console.log({channel});
        if (!channel) return interaction.reply({
            embeds: [EmbedBuilder.from({
                title: '⚠️ Wait a minute-!',
                description: '**This server has not yet configured a Character Submissions channel!**\n> Bug your server admins to make sure they set one up!'
            })]
        });

        // function to send a brand new submission message and create the thread
        const sendAndSave = async () => {
            return channel.send({
                embeds: [CharacterMenu.constructEmbed(character, interaction.member)],
                components: [
                    new ActionRowBuilder({
                        components: [
                            new ButtonBuilder({
                                customId: 'CHARACTERSUBMISSION:APPROVE',
                                label: 'Approve Submission',
                                emoji: '✅',
                                style: ButtonStyle.Success,
                            }),
                            new ButtonBuilder({
                                customId: 'CHARACTERSUBMISSION:REFRESH',
                                label: 'Refresh Submission',
                                emoji: '🔃',
                                style: ButtonStyle.Secondary,
                            }),
                        ]
                    }),
                    new ActionRowBuilder({
                        components: [
                            new ButtonBuilder({
                                customId:'CHARACTERSUBMISSION:DELETE',
                                label: 'Delete',
                                emoji: '🗑️',
                                style: ButtonStyle.Secondary,
                            }),
                        ]
                    }),
                ]
            }).then(m => {
                // store as active submission
                server.submissions?.messageIdToAuthorId?.set(m.id, character.userId);
                server.submissions?.authorIdToMessageId?.set(character.userId, m.id);
                server.save();

                // start thread for discussions
                m.startThread({
                    name: interaction.member.displayName + ' (' + interaction.user.username + ')\'s Character Submission',
                    reason: 'Incoming Character Submission',
                });
            });
        };

        // send or re-send message and start messages
        const alreadySubmittedMessageId = await this.getSubmissionMessageId(server, character.userId)
        if (alreadySubmittedMessageId) {
            const message = await channel.messages.fetch(alreadySubmittedMessageId).catch(() => false);
            if (message) {
                message.edit({
                    embeds: [CharacterMenu.constructEmbed(character, interaction.member)],
                    components: [
                        new ActionRowBuilder({
                            components: [
                                new ButtonBuilder({
                                    customId: 'CHARACTERSUBMISSION:APPROVE',
                                    label: 'Approve Submission',
                                    emoji: '✅',
                                    style: ButtonStyle.Success,
                                }),
                                new ButtonBuilder({
                                    customId: 'CHARACTERSUBMISSION:REFRESH',
                                    label: 'Refresh Submission',
                                    emoji: '🔃',
                                    style: ButtonStyle.Secondary,
                                }),
                            ]
                        }),
                        new ActionRowBuilder({
                            components: [
                                new ButtonBuilder({
                                    customId:'CHARACTERSUBMISSION:DELETE',
                                    label: 'Delete',
                                    emoji: '🗑️',
                                    style: ButtonStyle.Secondary,
                                }),
                            ]
                        }),
                    ]
                });
                return interaction.reply({
                    ephemeral: true,
                    embeds: [EmbedBuilder.from({
                        title: '🔃 Refreshed submission',
                        description: '<#' + server.submissions?.channelId + '>'
                    })]
                });
            }

            // send and inform re-submission
            sendAndSave();
            interaction.reply({
                ephemeral: true,
                embeds: [EmbedBuilder.from({
                    title: '✅ Re-submitted!',
                    description: '<#' + server.submissions?.channelId + '>',
                })]
            });

            return;
        }
        
        // send and inform new submission
        sendAndSave();
        interaction.reply({
            ephemeral: true,
            embeds: [EmbedBuilder.from({
                title: '✅ Submitted!',
                description: '<#' + server.submissions?.channelId + '>',
            })]
        });
    }

    /**
     * 
     * @param {CommandInteraction} interaction 
     * @param {ServerSchema} server 
     */
    static async fetchProcessingChannel(interaction, server) {
        return interaction.guild.channels.fetch(server.submissions?.channelId || '0').catch(() => false);
    }

    /**
     * Get Character entry from submission
     * @param {ServerSchema} server 
     * @param {Message} message 
     */
    static async getSubmissionCharacter(server, message) {
        const authorId = this.getSubmissionAuthorId(server, message.id);
        return CoreUtil.Characters.cache.get(server.guildId, authorId);
    }

    /**
     * Get Author ID from Submission
     * @param {ServerSchema} server 
     * @param {string} messageId 
     */
    static getSubmissionAuthorId(server, messageId) {
        return server.submissions?.messageIdToAuthorId?.get(messageId);
    }

    static getSubmissionMessageId(server, authorId) {
        return server.submissions?.authorIdToMessageId?.get(authorId);
    }

    /**
     * Remove Submission's active status
     * @param {ServerSchema} server 
     * @param {string} authorId 
     * @param {string} messageId 
     */
    static removeSubmission(server, authorId = null, messageId = null) {
        if (!authorId && !messageId) throw new Error('Submission needs at least an authorId or messageId.');

        if (!authorId) authorId = server.submissions?.messageIdToAuthorId?.get(messageId);
        if (!messageId) messageId = server.submissions?.authorIdToMessageId?.get(authorId);

        server.submissions?.authorIdToMessageId?.delete(authorId);
        server.submissions?.messageIdToAuthorId?.delete(messageId);

        server.save();
    }
}

module.exports = SubmissionHandler;