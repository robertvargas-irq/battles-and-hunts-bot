const { ButtonInteraction, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const VerificationHandler = require('../../util/Verification/VerificationHandler');
const mongoose = require('mongoose');
const serverSchema = require('../../database/schemas/server');

/**
 * GLOBAL buttons handler
 * @param {ButtonInteraction} button Passed button interaction
 */
module.exports = async (button) => {

    console.log(button.customId);

    // route to the global request
    switch (button.customId.slice(7)) {
        case 'VERIFY_AGE': {
            // defer reply
            await button.deferReply({ ephemeral: true });
            
            // get server entry from the database
            const server = await VerificationHandler.FetchServer(interaction.guild.id);

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

            const verificationThreadMessage = await VerificationHandler.pushToVerificationThread(verificationThread, {
                embeds: [new MessageEmbed()
                    .setColor('AQUA')
                    .setTitle('Adult Verification Request')
                    .setThumbnail(button.member.displayAvatarURL())
                    .setDescription('Incoming request from:'
                    + '\n`Nickname`: **' + button.member.displayName + '**'
                    + '\n`Username`: ' + button.user.tag
                    + '\n`Mention`: <@' + button.user.id + '>'
                    + '\n`UserID`: ' + button.user.id
                    )
                    .setTimestamp()
                ],
                components: [
                    new MessageActionRow({
                        components: [
                            new MessageButton({
                                style: 'SUCCESS',
                                emoji: '✅',
                                label: 'Verify Request',
                                customId: 'GLOBAL_ACCEPT_VERIFICATION'
                            }),
                            new MessageButton({
                                style: 'DANGER',
                                emoji: '⛔',
                                label: 'Deny',
                                customId: 'GLOBAL_DENY_VERIFICATION'
                            }),
                        ],
                    }),
                ],
            }, button.user.id != '264886440771584010' ? ['206166007645995009', '264886440771584010', '363470341156110336', '418635972427776001'] : []);
            VerificationHandler.setPending(server, button.user.id, verificationThreadMessage.id);

            // finally, notify of successful request and save
            await button.editReply(VerificationHandler.REPLIES.REQUEST_SENT);
            await server.save();
            
            console.log("VERIFY_AGE");
            break;
        }

        case 'ACCEPT_VERIFICATION': {
            // unarchive the thread
            await button.deferUpdate();
            await button.message.fetch();
            if (button.user.id === '723764223519228008') return; // Stone-Pool cannot verify.
            if (button.channel.isThread() && button.channel.archived) button.channel.setArchived(false, 'Accept Verification emitted; unarchiving.');
            
            // get server entry from the database
            const server = await VerificationHandler.FetchServer(interaction.guild.id);

            // check to see if the request is already pending
            if (!VerificationHandler.isPending(server, null, button.message.id))
                return button.message.edit({
                    embeds: [button.message.embeds[0]
                        .setColor('YELLOW')
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
                embeds: [new MessageEmbed()
                    .setColor('GREEN')
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
                embeds: [button.message.embeds[0]
                    .setTitle('✅ User has been verified')
                    .setColor('GREEN')
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
            await button.deferUpdate();
            await button.message.fetch();
            if (button.user.id === '723764223519228008') return; // Stone-Pool cannot verify.
            if (button.channel.isThread() && button.channel.archived) button.channel.setArchived(false, 'Accept Verification emitted; unarchiving.');
            
            // get server entry from the database
            const server = await VerificationHandler.FetchServer(interaction.guild.id);

            // check to see if the request is already pending
            if (!VerificationHandler.isPending(server, null, button.message.id))
                return button.message.edit({
                    embeds: [button.message.embeds[0]
                        .setColor('YELLOW')
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
                embeds: [new MessageEmbed()
                    .setColor('YELLOW')
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
                embeds: [button.message.embeds[0]
                    .setColor('RED')
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

    }
}