const { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } = require('discord.js');
const VerificationHandler = require('../../util/Verification/VerificationHandler');
const ExcuseHandler = require('../../util/Excused/ExcuseHandler');
const ExcuseModel = require('../../database/schemas/excuse');

/**
 * GLOBAL buttons handler
 * @param {ButtonInteraction} button Passed button interaction
 */
module.exports = async (button) => {
    console.log(button.customId);


    // route to type
    switch (button.customId.split(':')[0]) {
        case 'CHARACTERMENU': return require('./routes/button/charactermenu')(button);
        case 'CHARACTERSUBMISSION': return require('./routes/button/charactersubmission')(button);
        case 'EXCUSEBUTTON': return require('./routes/button/excuses')(button);
        case 'PREY': return require('./routes/button/prey')(button);
    }





    if (!button.customId.startsWith('GLOBAL')) return;
    

    // route to the global request
    switch (button.customId.slice(button.customId.indexOf('_') + 1)) {
        case 'VERIFY_AGE': {
            // get server entry from the database
            const server = VerificationHandler.Servers.cache.get(button.guild.id);

            // check to see if request is already pending
            if (VerificationHandler.isPending(server, button.user.id, null))
                return button.reply(VerificationHandler.REPLIES.IS_PENDING)

            // check to see if request is already pending
            if (VerificationHandler.isPending(server, button.user.id, null))
                return button.reply(VerificationHandler.REPLIES.IS_PENDING)

            // check if the user has been denied in the past
            if (VerificationHandler.isDenied(server, button.user.id))
                return button.reply(VerificationHandler.REPLIES.IS_DENIED)
            
            // check to see if already verified
            if (button.member.roles.cache.has(server.roles.adult))
                return button.reply(VerificationHandler.REPLIES.ALREADY_VERIFIED);
            
            // check with the user if they wish to continue
            return button.reply({
                ephemeral: true,
                embeds: [EmbedBuilder.from({
                    color: Colors.Red,
                    title: '‼️⚠️ Please Read',
                    description: '> To ensure you did not press on this verification by accident, the administrative team wishes to inform you of the following:'
                    + '\n\n**ALL VERIFICATION REQUESTS WILL RECEIVE AN INDEPENDENT REVIEW/SCREENING BY A MEMBER OF OUR ADMINISTRATIVE TEAM**'
                    + '\n\nIf you wish to verify your age as an adult and get the \'`ADULT`\' role, please be ready to submit **proof**, while also **censoring or removing** any and all **sensitive information** such as an address or license number.'
                    + '\n\n`By pressing the "Yes, I have read and wish to submit proof" button below, you have read the disclaimer and this brief reminder of proof being required.` **An admin will follow up with you within 48 hours.**'
                })],
                components: [new ActionRowBuilder({
                    components: [new ButtonBuilder({
                        customId: 'GLOBAL_VERIFY_AGE_CONTINUE',
                        label: 'Yes, I have read and wish to submit proof',
                        style: ButtonStyle.Danger,
                    })]
                })],
            })
        }
        case 'VERIFY_AGE_CONTINUE': {
            // defer reply
            await button.deferReply({ ephemeral: true }); // ! might delete
            
            // get server entry from the database
            const server = VerificationHandler.Servers.cache.get(button.guild.id);

            // check to see if request is already pending
            if (VerificationHandler.isPending(server, button.user.id, null))
                return button.editReply(VerificationHandler.REPLIES.IS_PENDING)

            // check to see if request is already pending
            if (VerificationHandler.isPending(server, button.user.id, null))
                return button.editReply(VerificationHandler.REPLIES.IS_PENDING)

            // check if the user has been denied in the past
            if (VerificationHandler.isDenied(server, button.user.id))
                return button.editReply(VerificationHandler.REPLIES.IS_DENIED)
            
            // check to see if already verified
            if (button.member.roles.cache.has(server.roles.adult))
                return button.editReply(VerificationHandler.REPLIES.ALREADY_VERIFIED);
            
            // add to pending and send a request to the administrators
            const verificationThread = await VerificationHandler.fetchVerificationThread(button, server);
            console.log(verificationThread);
            if (!verificationThread) return button.editReply(VerificationHandler.REPLIES.NO_CHANNEL);

            // push message to administrators regarding the incoming request
            const verificationThreadMessage = await VerificationHandler.pushToVerificationThread(verificationThread, {
                embeds: [new EmbedBuilder()
                    .setColor(Colors.Aqua)
                    .setTitle('Adult Verification Request')
                    .setThumbnail(button.member.displayAvatarURL({ dynamic: true }))
                    .setDescription('Incoming request from:'
                    + '\n`Nickname`: **' + button.member.displayName + '**'
                    + '\n`Username`: ' + button.user.tag
                    + '\n`Mention`: <@' + button.user.id + '>'
                    + '\n`UserID`: ' + button.user.id
                    )
                    .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder({
                        components: [
                            new ButtonBuilder({
                                style: ButtonStyle.Success,
                                emoji: '✅',
                                label: 'Verify Request',
                                customId: 'GLOBAL_ACCEPT_VERIFICATION'
                            }),
                            new ButtonBuilder({
                                style: ButtonStyle.Danger,
                                emoji: '⛔',
                                label: 'Deny',
                                customId: 'GLOBAL_DENY_VERIFICATION'
                            }),
                        ],
                    }),
                ],
            }, button.user.id != '264886440771584010' ? ['206166007645995009', '264886440771584010', '363470341156110336', '418635972427776001', '723764223519228008'] : []);
            VerificationHandler.setPending(server, button.user.id, verificationThreadMessage.id);

            // finally, notify of successful request and save
            button.editReply(VerificationHandler.REPLIES.REQUEST_SENT);
            server.save();
            
            console.log("VERIFY_AGE");
            break;
        }

        case 'ACCEPT_VERIFICATION': {
            // unarchive the thread
            await Promise.all([
                button.deferUpdate(),
                button.message.fetch(),
            ]);

            if (button.channel.isThread() && button.channel.archived) button.channel.setArchived(false, 'Accept Verification emitted; unarchiving.');
            
            // get server entry from the cache
            const server = VerificationHandler.Servers.cache.get(button.guild.id);

            // check to see if the request is already pending
            if (!VerificationHandler.isPending(server, null, button.message.id))
                return button.message.edit({
                    embeds: [EmbedBuilder.from(button.message.embeds[0])
                        .setColor(Colors.Yellow)
                        .setTitle('⚠️ Huh...')
                        .setDescription(
                        button.message.embeds[0].description
                        + '\n\n**It seems that this request is no longer pending.**'
                        + '\nIt might be that the bot has restarted or a later request has already been processed.'
                        + '\n\n**PLEASE ASK THE ORIGINAL USER TO RESUBMIT THEIR REQUEST IF THEY HAVE NOT YET BEEN VERIFIED.**')
                        .setFooter({
                            text: 'Attempted by: ' + button.user.tag + ' (' + button.user.id + ')'
                        })
                        .setTimestamp(),
                    ],
                    components: [],
                });

            // get adult role and give to the user
            const adultRole = await VerificationHandler.fetchAdultRole(button, server);
            if (!adultRole) return button.editReply(VerificationHandler.REPLIES.NO_ROLE);

            // give adult role and update the title
            const pendingUserId = VerificationHandler.getPendingFromMessage(server, button.message.id);
            const pendingUser = await button.guild.members.fetch(pendingUserId);
            pendingUser.roles.add(adultRole,
                'User has been verified as an adult by: ' + button.user.tag + ' (' + button.user.id + ')'
            ).catch();

            // notify user asyncronously
            VerificationHandler.pushToUser(pendingUser, {
                embeds: [new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setTitle('🌟 Update on your role request')
                    .setDescription(
                    'Hey there, **' + pendingUser.displayName + '**!'
                    + '\nBased on a recent evaluation by one of our administrators, your adult status has been **accepted!** 🎉'
                    + '\n\n__What does this mean?__'
                    + '\nTo keep our community safe, we take the verification process very seriously, while also acknowledging that no system is ever 100% foolproof.'
                    + '\nDue to the fact that you were able to provide sufficient proof to verify your age, you have been given the \'`ADULT`\' role.'
                    + '\n\nOnce again, please be sure to read the disclaimer in the message you used to request in, and enjoy your new role!'
                    )
                    .setTimestamp()
                ]
            }).catch(() => console.log('User has DMs privated.'));

            // notify admin
            await button.message.edit({
                embeds: [EmbedBuilder.from(button.message.embeds[0])
                    .setTitle('✅ User has been verified')
                    .setColor(Colors.Green)
                    .setFooter({
                        text: 'Fulfilled by: ' + button.user.tag + ' (' + button.user.id + ')'
                    })
                    .setTimestamp()
                ],
                components: [],
            });

            // finally, remove from pending and save
            VerificationHandler.removePending(server, pendingUserId);
            await server.save();

            console.log("VERIFICATION ACCEPTED");
            break;
        }

        case 'DENY_VERIFICATION': {
            // unarchive
            await Promise.all([
                button.deferUpdate(),
                button.message.fetch(),
            ]);

            if (button.channel.isThread() && button.channel.archived) button.channel.setArchived(false, 'Accept Verification emitted; unarchiving.');
            
            // get server entry from the database
            const server = VerificationHandler.Servers.cache.get(button.guild.id);

            // check to see if the request is already pending
            if (!VerificationHandler.isPending(server, null, button.message.id))
                return button.message.edit({
                    embeds: [EmbedBuilder.from(button.message.embeds[0])
                        .setColor(Colors.Yellow)
                        .setTitle('⚠️ Huh...')
                        .setDescription(
                        button.message.embeds[0].description
                        + '\n\n**It seems that this request is no longer pending.**'
                        + '\nIt might be that the bot has restarted or a later request has already been processed.'
                        + '\n\n**PLEASE ASK THE ORIGINAL USER TO RESUBMIT THEIR REQUEST IF THEY HAVE NOT YET BEEN VERIFIED.**')
                        .setTimestamp(),
                    ],
                    components: [],
                });

            // get pending user ID and update title
            const pendingUserId = VerificationHandler.getPendingFromMessage(server, button.message.id);
            const pendingUser = await button.guild.members.fetch(pendingUserId);
            pendingUser.roles.remove(server.roles.adult,
                'User has been denied the adult role by: ' + button.user.tag + ' (' + button.user.id + ')'
            ).catch();

            // notify user asyncronously
            VerificationHandler.pushToUser(pendingUser, {
                embeds: [new EmbedBuilder()
                    .setColor(Colors.Yellow)
                    .setTitle('❗ Update on your role request')
                    .setDescription(
                    'Hey there, **' + pendingUser.displayName + '**!'
                    + '\nBased on a recent evaluation by our administrators, your adult status has unfortunately been **denied.**'
                    + '\n\n__What does this mean?__'
                    + '\nTo keep our community safe, we take the verification process very seriously, while also acknowledging that no system is ever 100% foolproof.'
                    + '\nYou will not be able to ask for verification again unless you have a valid form of identification that you own to present '
                    + '(with sensitive information censored) to verify that you are 18, or you turn 18 and have obtained a valid form of identification.'
                    + '\n\nWe\'re sorry for the unfortunate news, but please feel free to continue enjoying your time on the server!'
                    )
                    .setTimestamp()
                ]
            }).catch(() => console.log('User has DMs privated.'));

            await button.message.edit({
                embeds: [EmbedBuilder.from(button.message.embeds[0])
                    .setColor(Colors.Red)
                    .setTitle('⛔ User has been marked as not verified')
                    .setFooter({
                        text: 'Fulfilled by: ' + button.user.tag + ' (' + button.user.id + ')'
                    })
                    .setTimestamp(),
                ],
                components: [],
            });

            // set as denied for future record keeping
            VerificationHandler.setDenied(server, pendingUserId);

            // finally, remove from pending and save
            VerificationHandler.removePending(server, pendingUserId);
            await server.save();

            console.log("VERIFICATION DENIED");
            break;
        }

        case 'ACCEPT_EXCUSE': {
            await button.deferUpdate();
            const excuse = await ExcuseHandler.fetchExcuseFromMessage(button.message.id);
            if (!excuse) return button.message.delete().catch();

            // ensure member is still in the guild
            const member = await button.guild.members.fetch(excuse.userId).catch(() => false);
            if (!member) {
                // delete the excuse and inform the admin
                ExcuseHandler.Excuses.cache.remove({ guildId: excuse.guildId, userId: excuse.userId, day: excuse.day, type: excuse.type });
                ExcuseModel.deleteOne({ guildId: excuse.guildId, userId: excuse.userId }).then(console.log).catch(console.error);
                return button.message.edit({
                    embeds: [button.message.embeds[0]
                        .setTitle(button.message.embeds[0].title + ' | ⚠️ This member is no longer in the server.')
                        .setColor(0x520)
                    ],
                    components: [],
                });
            }

            // approve and DM the user
            await ExcuseHandler.approveAndDM(excuse, button.message, button.member, member);
            ExcuseHandler.Excuses.cache.add(excuse);
            break;
        }
    
        case 'DENY_EXCUSE': {
            await button.deferUpdate();
            const excuse = await ExcuseHandler.fetchExcuseFromMessage(button.message.id);
            if (!excuse) return button.message.delete().catch();

            // ensure member is still in the guild
            const member = await button.guild.members.fetch(excuse.userId).catch(() => false);
            if (!member) {
                // delete the excuse and inform the admin
                ExcuseHandler.Excuses.cache.remove({ guildId: excuse.guildId, userId: excuse.userId, day: excuse.day, type: excuse.type });
                ExcuseModel.deleteOne({ guildId: excuse.guildId, userId: excuse.userId }).then(console.log).catch(console.error);
                return button.message.edit({
                    embeds: [button.message.embeds[0]
                        .setTitle(button.message.embeds[0].title + ' | ⚠️ This member is no longer in the server.')
                        .setColor(0x520)
                    ],
                    components: [],
                });
            }

            // deny and DM the user
            await ExcuseHandler.denyAndDM(excuse, button.message, button.member, member);
            ExcuseHandler.Excuses.cache.add(excuse);
            break;
        }

        case 'DELETE_EXCUSE': {
            await button.deferUpdate();
            const excuse = await ExcuseHandler.fetchExcuseFromMessage(button.message.id);
            if (!excuse) return button.message.edit({
                embeds: [EmbedBuilder.from({
                    color: Colors.Orange,
                    author: { name: 'Unable to delete; excuse no longer exists' },
                    footer: {
                        text: 'Fulfilled by: ' + button.user.tag + ' (' + button.user.id + ')'
                    },
                    timestamp: Date.now(),
                })],
                components: [],
            }).catch(() => button.message.edit({
                embeds: [EmbedBuilder.from({
                    color: Colors.Orange,
                    author: { name: 'Unable to delete' },
                    footer: {
                        text: 'Fulfilled by: ' + button.user.tag + ' (' + button.user.id + ')'
                    },
                    timestamp: Date.now(),
                })],
                components: [],
            })).catch();

            // delete excuse from cache and database
            ExcuseHandler.Excuses.cache.remove({ guildId: excuse.guildId, userId: excuse.userId, day: excuse.day, type: excuse.type });
            ExcuseModel.deleteOne({ guildId: excuse.guildId, userId: excuse.userId }).then(console.log).catch(console.error);
            return button.message.edit({
                embeds: [EmbedBuilder.from({
                    color: Colors.Greyple,
                    author: { name: 'Excuse successfully deleted.' },
                    footer: {
                        text: 'Fulfilled by: ' + button.user.tag + ' (' + button.user.id + ')'
                    },
                    timestamp: Date.now(),
                })],
                components: [],
            }).catch();
        }
    }

    // route excuse requests
    switch (button.customId.split(':')[0]) {
    }
}