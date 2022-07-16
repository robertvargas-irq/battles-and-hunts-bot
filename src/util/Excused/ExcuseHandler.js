const {
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    GuildMember,
    Message,
    CommandInteraction,
    ModalSubmitInteraction,
} = require('discord.js');
const CoreUtil = require('../CoreUtil');
const Excuse = require('../../database/schemas/excuse');

const SESSION_DAYS = [
    'Friday', 'Saturday', 'Sunday'
];

const EXCUSE_TYPES = [
    'Absence',
    'Left Early',
    'Late',
];

class ExcuseHandler extends CoreUtil {

    /**
     * @typedef {'FRIDAY'|'SATURDAY'|'SUNDAY'} days
     * @typedef {'ABSENCE'|'LEFT EARLY'|'LATE'} types
     */

    static days = SESSION_DAYS;
    static types = EXCUSE_TYPES;
    static EXCUSE_STATUSES = {
        PENDING: 'PENDING',
        APPROVED: 'APPROVED',
        DENIED: 'DENIED',
    };

    static setProcessingChannel(serverModel, channelId) {
        serverModel.excusesChannelId = channelId;
    }

    static setMenuMessage(serverModel, channelId, messageId) {
        serverModel.excusesMenuChannelId = channelId;
        serverModel.excusesMenuMessageId = messageId;
    }

    /**
     * Fetch the menu message for excuse form submissions
     * @param {CommandInteraction} interaction 
     * @param {import('../../database/schemas/server').ServerSchema} serverModel 
     */
    static async fetchMenuMessage(interaction, serverModel) {
        const channelId = serverModel.excusesMenuChannelId;
        const messageId = serverModel.excusesMenuMessageId;

        if (!channelId || !messageId) return;

        // fetch channel from id
        const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
        if (!channel) return false;

        // fetch message from id
        const message = await channel.messages.fetch(messageId).catch(() => false);
        return message;
    }

    /**
     * 
     * @param {Message} message 
     * @param {import('../../database/schemas/server').ServerSchema} serverSchema 
     */
    static async renderMenu(message, serverSchema) {
        const embeds = message.embeds;
        return message.edit({
            embeds,
            components: [
                new MessageActionRow({
                    components: this.generateDayButtons(serverSchema)
                }),
                new MessageActionRow({
                    components: [new MessageButton({
                        customId: 'EXCUSEBUTTON_VIEW',
                        style: 'PRIMARY',
                        label: 'View the status of your excuses',
                        emoji: '📝'
                    })],
                }),
            ]
        });
    }

    /**
     * Approve and send a direct message to the user
     * @param {Excuse} excuse Full excuse from the database
     * @param {Message} message The processing message
     * @param {GuildMember} admin Issuing admin
     * @param {GuildMember} member User that originally made the excuse
     * @returns {Promise<Message>}
     */
    static async approveAndDM(excuse, message, admin, member) {
        let errorSending = false;
        await member.user.send({
            embeds: [new MessageEmbed({
                color: 'GREEN',
                author: {
                    name: message.guild.name,
                    iconURL: message.guild.iconURL()
                },
                title: 'Update on your excused ' + excuse.type,
                description: 'This excuse has been **APPROVED**.',
                fields: [
                    {
                        name: 'Approving Administrator',
                        value: '> `' + admin.displayName + '` (' + admin.user.tag + ')',
                    },
                    {
                        name: 'Day',
                        value: '> `' + excuse.day + '`',
                        inline: true,
                    },
                    {
                        name: 'Type',
                        value: '> `' + excuse.type + '`',
                        inline: true,
                    },
                    {
                        name: 'Original Reason Given',
                        value: '> ' + excuse.reason,
                    },
                ],
                timestamp: Date.now(),
            })],
        }).catch((e) => { console.log(e); errorSending = true });

        // update excuse status and message embed to reflect approval
        excuse.status = this.EXCUSE_STATUSES.APPROVED;
        excuse.save();

        // save to the member's excuse tracker
        const memberDocument = this.Members.cache.get(excuse.guildId, excuse.userId);
        if (memberDocument) {
            memberDocument.excuses.approved.total++;
            memberDocument.excuses.approved[excuse.type.replace(/ +/, '_').toLowerCase()]++;
            memberDocument.save();
        }

        return message.edit({
            embeds: [new MessageEmbed(message.embeds[0])
                .setColor('GREEN')
                .setAuthor({
                    name: '✅ Approved'
                    + (errorSending ? ' | ⚠️ Failed to DM' : '')
                    + (!memberDocument ? ' | ⚠️ This member is not registered to the bot yet; excuse not recorded to their history.' : '')
                })
                .setFooter({ text: 'Fulfilled by: ' + admin.user.tag + '(' + admin.user.id + ')' })
                .setTimestamp(),
            ],
            components: [],
        });
    }

    /**
     * Deny and send a direct message to the user
     * @param {Excuse} excuse Full excuse from the database
     * @param {Message} message The processing message
     * @param {GuildMember} admin Issuing admin
     * @param {GuildMember} member User that originally made the excuse
     * @returns {Promise<Message>}
     */
     static async denyAndDM(excuse, message, admin, member) {
        let errorSending = false;
        await member.user.send({
            embeds: [new MessageEmbed({
                color: 'RED',
                author: {
                    name: message.guild.name,
                    iconURL: message.guild.iconURL()
                },
                title: 'Update on your excused ' + excuse.type,
                description: 'This excuse has been deemed **INSUFFICIENT**.',
                fields: [
                    {
                        name: 'Reviewing Administrator',
                        value: '> `' + admin.displayName + '` (' + admin.user.tag + ')',
                    },
                    {
                        name: 'Day',
                        value: '> `' + excuse.day + '`',
                        inline: true,
                    },
                    {
                        name: 'Type',
                        value: '> `' + excuse.type + '`',
                        inline: true,
                    },
                    {
                        name: 'Original Reason Given',
                        value: '> ' + excuse.reason,
                    },
                ],
                timestamp: Date.now(),
            })],
        }).catch((e) => { console.log(e); errorSending = true });

        // update excuse status and message embed to reflect denied request
        excuse.status = this.EXCUSE_STATUSES.DENIED;
        excuse.save();

        // save to the member's excuse tracker
        const memberDocument = this.Members.cache.get(excuse.guildId, excuse.userId);
        if (memberDocument) {
            memberDocument.excuses.denied.total++;
            memberDocument.excuses.denied[excuse.type.replace(/ +/, '_').toLowerCase()]++;
            memberDocument.save();
        }

        // return the excuse form
        return message.edit({
            embeds: [new MessageEmbed(message.embeds[0])
                .setColor('RED')
                .setAuthor({
                    name: '⛔️ Insufficient Excuse'
                    + (errorSending ? ' | ⚠️ Failed to DM' : '')
                    + (!memberDocument ? ' | ⚠️ This member is not registered to the bot yet; excuse not recorded to their history.' : '')
                })
                .setFooter({ text: 'Fulfilled by: ' + admin.user.tag + '(' + admin.user.id + ')' })
                .setTimestamp(),
            ],
            components: [],
        });
    }

    /**
     * Fetch an excuse from the database
     * @param {string} userId 
     * @param {string} guildId 
     * @param {days} day 
     * @param {types} type 
     * @returns {Promise<Excuse>}
     */
    static async fetchExcuse(userId, guildId, day, type) {
        return Excuse.findOne({ userId, guildId, day, type }).exec();
    } 

    /**
     * Fetch all excuses from the database
     * @param {string} guildId 
     * @param {days} day 
     * @returns {Promise<Excuse[]>}
     */
    static async fetchAllExcuses(guildId, day) {
        return Excuse.find({ guildId, day }).exec();
    }

    /**
     * Fetch a given excuse from the request message it sent
     * @param {string} messageId Message sent to the administrative team with confirm/deny
     * @returns {Promise<Excuse>}
     */
    static async fetchExcuseFromMessage(messageId) {
        return Excuse.findOne({ processingMessageId: messageId });
    }

    /**
     * Delete all the excuses of a given day and delete the associated thread
     * @param {CommandInteraction} interaction 
     * @param {days} day Requested day to delete
     * @returns {Promise<{deletedCount: number}>}
     */
    static async clearDayAndDeleteThread(interaction, day) {

        // delete the actual thread associated with the day
        const server = this.Servers.cache.get(interaction.guild.id)
        const threadId = server.excusesThreads.get(day);
        if (!threadId) return;
        
        // // console.log({threadId});

        // delete the corresponding thread
        interaction.guild.channels.fetch(threadId)
        .then(thread => {
            thread.delete().catch();
        })
        .catch(() => false);

        // delete all excuses from the cache then from the database for a given day
        const cache = this.Excuses.cache;
        await this.fetchAllExcuses(interaction.guild.id, day).then(excuses => {
            if (!excuses) return;
            excuses.forEach(e => cache.remove(e));
        });
        return Excuse.deleteMany({ guildId: interaction.guild.id, day });
    }

    /**
     * See if an excuse day is paused
     * @param {string} guildId Guild to check
     * @param {days} day Day to check
     * @returns {boolean}
     */
    static dayIsPaused(guildId, day) {
        const server = this.Servers.cache.get(guildId);
        return server.excusesPaused.has(day);
    }

    /**
     * Pause incoming excuses for a given day.
     * @param {string} guildId 
     * @param {days} day 
     * @returns {boolean} True if paused | False if already paused
     */
    static pause(guildId, day) {
        const server = this.Servers.cache.get(guildId);

        // if already paused, return false
        if (server.excusesPaused.has(day)) return false;

        // pause and save
        const date = new Date();
        const dateString = date.toLocaleDateString('default', {month: 'long'}) + ' ' + date.getUTCDate();
        server.excusesPaused.set(day, dateString);
        server.save();

        return true;
    }

    /**
     * Resume incoming excuses for a given day.
     * @param {string} guildId 
     * @param {days} day 
     * @returns {boolean} True if resumed | False if already resumed
     */
    static resume(guildId, day) {
        const server = this.Servers.cache.get(guildId);

        // if already resumed, return false
        if (!server.excusesPaused.has(day)) return false;

        // resume and save
        server.excusesPaused.delete(day);
        server.save();

        return true;
    }

    /**
     * Post the provided excuse
     * @param {ModalSubmitInteraction} interaction
     * @param {Excuse} excuse 
     * @returns {Promise<Message>}
     */
    static async post(interaction, excuse) {
        const server = this.Servers.cache.get(excuse.guildId);
        const excuseChannelParent = await interaction.guild.channels.fetch(server.excusesChannelId).catch(() => false)
        || interaction.channel;

        // fetch thread
        let excuseThreadId = server.excusesThreads.get(excuse.day);
        let excuseThread = await interaction.guild.channels.fetch(excuseThreadId).catch(() => false);

        // if no excuse thread, erase any possible excuses that might have been within it
        if (excuseThreadId && !excuseThread) await Excuse.deleteMany({
            guildId: excuse.guildId,
            day: excuse.day,
        });

        // if no thread exists for a given day, create and set
        if (!excuseThreadId || !excuseThread) {
            excuseThread = await excuseChannelParent.threads.create({
                name: excuse.day + ' Excuses',
                reason: 'Needed an excuse thread for: ' + excuse.day,
            });
            server.excusesThreads.set(excuse.day, excuseThread.id);
            server.save();

            // add everyone in the current channel to the new thread
            for (const [_, member] of (await excuseChannelParent.fetch()).members)
                if (!member.user.bot) excuseThread.members.add(member.user.id);
        }

        // post the excuse for administrative review
        const typeIndex = ['ABSENCE', 'LEFT EARLY', 'LATE'].indexOf(excuse.type);
        const emoji = ['❌', '🏃', '⏰'][typeIndex];
        const color = ['ORANGE', 'BLURPLE', 'YELLOW'][typeIndex];

        return excuseThread.send({
            embeds: [new MessageEmbed()
                .setColor(color)
                .setTitle(emoji + ' ' + excuse.type + ' FORM')
                .setThumbnail(interaction.member.displayAvatarURL({ dynamic: true }))
                .setDescription('Incoming request from:'
                + '\n`Nickname`: **' + interaction.member.displayName + '**'
                + '\n`Username`: ' + interaction.user.tag
                + '\n`Mention`: <@' + interaction.user.id + '>'
                + '\n`UserID`: ' + interaction.user.id
                )
                .addFields([{
                    name: 'Reason Given',
                    value: '> ' + excuse.reason,
                }])
                .setTimestamp()
            ],
            components: [
                new MessageActionRow({
                    components: [
                        new MessageButton({
                            style: 'SUCCESS',
                            emoji: '✅',
                            label: 'Acceptable Excuse',
                            customId: 'GLOBAL_ACCEPT_EXCUSE'
                        }),
                        new MessageButton({
                            style: 'DANGER',
                            emoji: '⛔',
                            label: 'Insufficient Excuse',
                            customId: 'GLOBAL_DENY_EXCUSE'
                        }),
                        new MessageButton({
                            style: 'SECONDARY',
                            emoji: '🗑',
                            label: 'Delete',
                            customId: 'GLOBAL_DELETE_EXCUSE',
                        }),
                    ],
                }),
            ],
        })

    }

    /**
     * Generate day buttons based on paused days
     * @param {import('../../database/schemas/server').ServerSchema} serverSchema 
     */
    static generateDayButtons(serverSchema) {
        const paused = serverSchema.excusesPaused;

        return this.days.map(day => {
            const p = paused.has(day.toUpperCase());
            return new MessageButton({
                customId: 'EXCUSEBUTTON:' + day.toUpperCase(),
                style: p ? 'SECONDARY' : 'SUCCESS',
                emoji: p ? '⏸️' : undefined,
                label: p ? day + ' : Under review since ' + paused.get(day.toUpperCase()) : day,
                disabled: p
            });
        }).sort((a, b) => a.disabled - b.disabled);
    }
}

module.exports = ExcuseHandler;