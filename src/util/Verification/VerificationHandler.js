const { BaseCommandInteraction, GuildChannelManager, ThreadManager, MessageEmbed, MessageActionRow, MessageButton, GuildChannel, Message, ThreadChannel, MessagePayload } = require('discord.js');
const serverSchema = require('../../database/schemas/server');

class VerificationHandler {

    /**
     * Set roles to server database
     * @param {serverSchema} server Server database entry
     */
    static setAdultRole(server, adultRoleId) {
        server.roles.adult = adultRoleId;
    }

    /**
     * Get the adult guild role
     * @param {BaseCommandInteraction} interaction Original Discord interaction
     * @param {serverSchema} server Server database entry
     * @returns Adult Role if found | False if not found
     */
    static async fetchAdultRole(interaction, server) {
        return await interaction.guild.roles.fetch(server.roles.adult).catch(() => false);
    }

    /**
     * Check to see if a user is pending
     * @param {serverSchema} server Server database entry
     * @param {string} userId The user to check for
     * @param {string} messageId The message to check for
     * @returns {boolean} True if pending | False if not
     */
    static isPending(server, userId, messageId = null) {
        console.log({server, userId, messageId});
        console.log({ver: server.verification});

        if (!userId && !messageId) return false;

        return (!userId || server.verification.pendingToMessageId.has(userId))
        && (!messageId || server.verification.messageIdToPending.has(messageId));
    }
    
    /**
     * Set a user to the pending set
     * @param {serverSchema} server Server database entry
     * @param {string} userId The user to set as pending
     * @param {string} threadMessageId The message ID sent to the administrators
     */
    static setPending(server, userId, threadMessageId) {
        // set to server
        server.verification.pendingToMessageId.set(userId, threadMessageId);
        server.verification.messageIdToPending.set(threadMessageId, userId);
        server.markModified("verification");
    }
    
    /**
     * Remove a user from the pending list
     * @param {serverSchema} server Server database entry
     * @param {string} userId The user to remove from the pending
     */
    static removePending(server, userId) {
        let messageId = server.verification.pendingToMessageId.get(userId);
        console.log({messageId});
        server.verification.messageIdToPending.delete(messageId);
        server.verification.pendingToMessageId.delete(userId);
        server.markModified("verification");
    }

    /**
     * Get the userId from the messageId
     * @param {serverSchema} server Server database entry
     * @param {string} messageId The message to request the pending user
     * @returns {string} UserId of pending user
     */
    static getPendingFromMessage(server, messageId) {
        return server.verification.messageIdToPending.get(messageId);
    }
    
    /**
     * Check to see if a user has already been denied in the past
     * @param {serverSchema} server Server database entry
     * @param {string} userId The user to check for
     * @returns True if Denied | False if not
     */
     static isDenied(server, userId) {
        return server.verification.deniedVerificationIds.has(userId);
    }

    /**
     * Set a user as being denied
     * @param {serverSchema} server Server database entry
     * @param {string} userId The user to deny
     */
    static setDenied(server, userId) {
        server.verification.deniedVerificationIds.set(userId, '');
        server.markModified('verification.deniedVerificationIds');
    }

    /**
     * Push a message to the verification thread
     * @param {ThreadChannel} threadChannel The channel to push a notification to
     * @param {MessagePayload} messagePayload Message to send
     * @param {string[]} usersToPing Users to ping
     * @returns {Promise<Message | Boolean>} Message if successfully sent | False if error
     */
    static async pushToVerificationThread(threadChannel, messagePayload, usersToPing) {
        if (threadChannel.archived) threadChannel.setArchived(false, 'Emitted Verification request.');
        await threadChannel.join();
        await threadChannel.parent.send('**🆔 New verification request pending:**\n> \n> <#' + threadChannel.id + '>\n> '
        + (usersToPing.length > 0 ? ('\n||' + usersToPing.map(u => '<@' + u + '>') + '||') : 'This is probably a test, no pings for now 💫'));
        return await threadChannel.send(messagePayload).catch(() => false);
    }

    /**
     * Send a message to the user
     * @param {*} user The user to DM
     * @param {MessagePayload} messagePayload Message to send
     */
    static async pushToUser(user, messagePayload) {
        return await user.send(messagePayload).catch(console.error);
    }

    /**
     * Fetch the verification notification thread
     * @param {BaseCommandInteraction} interaction Discord interaction
     * @param {serverSchema} server Server database entry
     * @returns {Promise<ThreadChannel>} Thread if found | False if no longer exists
     */
    static async fetchVerificationThread(interaction, server) {
        if (!server.verification.verificationThreadId) return false;
        return await interaction.guild.channels.fetch(server.verification.verificationThreadId).catch(() => false);
    }

    /**
     * Spawn and store verification message
     * @param {GuildChannelManager} guildChannel The channel to spawn the verification message inside
     */
    static async spawnVerificationRequest(guildChannel) {
        return await guildChannel.send({
            embeds: [new MessageEmbed({
                color: 'BLUE',
                title: '🌺 Adult Role and Verification',
                description: '⚠️\n> **THIS IS NOT A PASS TO FLIRT OR SEND INAPPROPRIATE MESSAGES TO OTHER USERS, REGARDLESS OF WHETHER OR NOT THEY HAVE THE \'`ADULT`\' ROLE ON THEIR ACCOUNT.**'
                + '\n\n**PLEASE REPORT ANY EXPLICIT BEHAVIOR FROM ANY PLATFORM.**'
                + '\n> Never assume anyone\'s age regardless of the \'`ADULT`\' role; while we are not liable, **ANY** explicit behavior **MUST** be reported to Discord\'s Trust and Safety Team, and one of the admins so that they can get banned immediately without delay.'
                + '\n\n——————————'
                + '\nIf you wish to verify your age as an adult and get the \'`ADULT`\' role, please be ready to submit **proof**, while also **censoring or removing** any and all **sensitive information** such as an address or license number.'
                + '\n This will also give you access to the **Adult Voice Channel** 🎉'
            })],
            components: [new MessageActionRow({
                components: [
                    new MessageButton({
                        style: "PRIMARY",
                        emoji: "🆔",
                        label: "Request Adult Role",
                        customId: "GLOBAL_VERIFY_AGE"
                    })
                ]
            })]
        }).catch(() => false);
    }

    /**
     * Spawn a verification thread in the requested channel
     * @param {serverSchema} server Server database entry
     * @param {GuildChannel} parentChannel Thread's parent
     * @returns {MessageChannel | Boolean} Resulting thread | False if not able to be created
     */
    static async spawnVerificationThread(server, parentChannel) {
        /**@type {ThreadChannel} Spawned thread */
        const spawnedThread = await parentChannel.send({
            embeds: [new MessageEmbed()
                .setColor('AQUA')
                .setTitle('Age Verification Thread')
                .setFooter({ text: 'Started ➡️' })
                .setTimestamp()
            ]
        })
        .then(/**@param {Message} m*/ async m => {
            return await m.startThread({
                name: 'Age Verification Requests',
                autoArchiveDuration: 60,
                reason: 'To process any age verification requests.',
                startMessage: m
            });
        }).
        catch(() => false);

        // save threadId to the database
        server.verification.verificationThreadId = spawnedThread.id;
        server.markModified('verification.verificationThreadId');

        return spawnedThread;
    }

    static REPLIES = {
        IS_DENIED: {
            embeds: [new MessageEmbed()
                .setColor('RED')
                .setTitle('⚠️ Hang on.')
                .setDescription(
                '**Your request has already been denied in the past, unfortunately you cannot request again.' + '**\nIf you believe that this is a mistake, please contact an administrator.')
            ]
        },
        IS_PENDING: {
            embeds: [new MessageEmbed()
                .setColor('YELLOW')
                .setTitle('🌟 Woah-!')
                .setDescription(
                '**Your request is currently being processed, and an admin will be with you shortly.**'
                + '\nAdministrators can get rather busy, we do heavily appreciate your patience!'
                + '\nDon\'t be afraid to ask if we have received your request!')
            ]
        },
        REQUEST_SENT: {
            embeds: [new MessageEmbed()
                .setColor('GREEN')
                .setTitle('✅ Request submitted')
                .setDescription(
                '**An administrator will contact you within 48 hours regarding verification.**'
                + '\nIf you pressed this button by mistake, please contact one of our administrators and let them know!'
                )
            ]
        },
        ALREADY_VERIFIED: {
            embeds: [new MessageEmbed()
                .setColor('AQUA')
                .setTitle('🎉 You\'re already verified!')
            ]
        },
        NO_CHANNEL: {
            embeds: [new MessageEmbed()
                .setColor('YELLOW')
                .setTitle('⚠️ Sorry, something went wrong')
                .setDescription(
                'It seems that the channel that administrators use to process verification requests is missing or destroyed.'
                + '\n\nPlease let an administrator know about this error.')
            ]
        },
        NO_ROLE: {
            embeds: [new MessageEmbed()
                .setColor('RED')
                .setTitle('❗ Missing Roles')
                .setDescription(
                '**The "Adult" role is missing or destroyed.**'
                + '\nPlease reset by using `/spawn-verification` once more.')
            ]
        }
    }

}

module.exports = VerificationHandler;