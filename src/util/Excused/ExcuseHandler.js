const { MessageEmbed, MessageActionRow, MessageButton, GuildMember, Message, BaseCommandInteraction, ModalSubmitInteraction } = require('discord.js');
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
        return message.edit({
            embeds: [new MessageEmbed(message.embeds[0])
                .setColor('GREEN')
                .setAuthor({ name: '✅ Approved' + (errorSending ? ' | ⚠️ Failed to DM' : '') })
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
        return message.edit({
            embeds: [new MessageEmbed(message.embeds[0])
                .setColor('RED')
                .setAuthor({ name: '⛔️ Insufficient Excuse' + (errorSending ? ' | ⚠️ Failed to DM' : '') })
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
     * @returns 
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
     * @param {BaseCommandInteraction} interaction 
     * @param {days} day Requested day to delete
     * @returns {Promise<{deletedCount: number}>}
     */
    static async clearDayAndDeleteThread(interaction, day) {

        // delete the actual thread associated with the day
        this.FetchServer(interaction.guild.id).then(async server => {
            console.log({server});
            const threadId = server.excusesThreads.get(day);
            if (!threadId) return;

            console.log({threadId});

            const thread = await interaction.guild.channels.fetch(threadId).catch(() => false);
            if (!thread) return;

            console.log({thread});
            
            thread.delete().catch();
        }).catch();

        // delete all excuses from a given day
        return Excuse.deleteMany({ guildId: interaction.guild.id, day });
    }

    /**
     * See if an excuse day is paused
     * @param {string} guildId Guild to check
     * @param {days} day Day to check
     * @returns {Promise<boolean>}
     */
    static async dayIsPaused(guildId, day) {
        const server = await this.FetchServer(guildId);
        return server.excusesPaused.has(day);
    }

    /**
     * Pause incoming excuses for a given day.
     * @param {string} guildId 
     * @param {days} day 
     * @returns {Promise<boolean>} True if paused | False if already paused
     */
    static async pause(guildId, day) {
        const server = await this.FetchServer(guildId);

        // if already paused, return false
        if (server.excusesPaused.has(day)) return false;

        // pause and save
        server.excusesPaused.set(day, day);
        await server.save();

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
                    ],
                }),
            ],
        })

    }
}

module.exports = ExcuseHandler;