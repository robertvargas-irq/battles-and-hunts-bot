const { ButtonInteraction, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const VerificationHandler = require('../../util/Verification/VerificationHandler');
const mongoose = require('mongoose');
const serverSchema = require('../../database/schemas/server');

/**
 * GLOBAL buttons handler
 * @param {ButtonInteraction} button Passed button interaction
 */
module.exports = async (button) => {

    // route to the global request
    switch (button.customId.slice(7)) {
        case 'VERIFY_AGE': {
            // first check to see if already pending
            await button.deferReply({ ephemeral: true });
            if (VerificationHandler.isPending(button.user.id))
                return button.editReply(VerificationHandler.REPLIES.IS_PENDING)
            
            // get server entry from the database
            const Server = mongoose.model('Server', serverSchema);
            let server = await Server.findOne({ guildId: button.guild.id });
            if (!server) server = await Server.create({ guildId: button.guild.id });
            console.log(server.verification);

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
            });
            VerificationHandler.setPending(button.user.id, verificationThreadMessage.id);

            // finally, notify of successful request
            await button.editReply(VerificationHandler.REPLIES.REQUEST_SENT);
            
            console.log("VERIFY_AGE");
            break;
        }

        case 'ACCEPT_VERIFICATION': {
            // first check to see if already pending
            await button.deferUpdate();
            if (button.user.id === '723764223519228008') return; // Stone-Pool cannot verify.
            if (!VerificationHandler.isPending(button.user.id, button.message.id))
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
            
            // get server entry from the database
            const Server = mongoose.model('Server', serverSchema);
            let server = await Server.findOne({ guildId: button.guild.id });
            if (!server) server = await Server.create({ guildId: button.guild.id });
            console.log(server.verification);

            // get adult role and give to the user
            const adultRole = await VerificationHandler.fetchAdultRole(button, server);
            if (!adultRole) return button.editReply(VerificationHandler.REPLIES.NO_ROLE);

            // give adult role and update the title
            const pendingUserId = VerificationHandler.getPendingFromMessage(button.message.id);
            await button.guild.members.fetch(pendingUserId).then(m => m.roles.add(adultRole,
                'User has been verified as an adult by: ' + button.user.tag + ' (' + button.user.id + ')')
            ).catch();

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

            // finally, remove from pending
            VerificationHandler.removePending(pendingUserId);

            console.log("VERIFICATION ACCEPTED");
            break;
        }

        case 'DENY_VERIFICATION': {
            // first check to see if already pending
            await button.deferUpdate();
            if (button.user.id === '723764223519228008') return; // Stone-Pool cannot verify.
            if (!VerificationHandler.isPending(button.user.id, button.message.id))
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
            
            // get server entry from the database
            const Server = mongoose.model('Server', serverSchema);
            let server = await Server.findOne({ guildId: button.guild.id });
            if (!server) server = await Server.create({ guildId: button.guild.id });
            console.log(server.verification);

            // get pending user ID and update title
            const pendingUserId = VerificationHandler.getPendingFromMessage(button.message.id);
            await button.guild.members.fetch(pendingUserId).then(m => m.roles.remove(server.roles.adult,
                'User has been denied the adult role by: ' + button.user.tag + ' (' + button.user.id + ')')
            ).catch();

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
            VerificationHandler.removePending(pendingUserId);
            await server.save();

            console.log("VERIFICATION DENIED");
            break;
        }

    }
}