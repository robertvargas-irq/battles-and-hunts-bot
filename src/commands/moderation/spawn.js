const { ApplicationCommandOptionType : CommandTypes } = require('discord-api-types/v10');
const { CommandInteraction, MessageEmbed, Permissions, MessageActionRow, MessageButton, ButtonStyle, ChannelType } = require('discord.js');
const VerificationHandler = require('../../util/Verification/VerificationHandler');
const ExcuseHandler = require('../../util/Excused/ExcuseHandler');
const PreyPile = require('../../util/Hunting/PreyPile');
const CoreUtil = require('../../util/CoreUtil');

module.exports = {
    name: 'spawn',
    description: 'Spawn in a specific prompt.',
    options: [
        {
            name: 'excuses',
            description: 'Spawn and configure Excuses.',
            type: CommandTypes.Subcommand,
            options: [
                {
                    name: 'excuse-processing-channel',
                    description: 'Which channel to spawn threads for each day.',
                    type: CommandTypes.Channel,
                    required: true,
                }
            ],
        },
        {
            name: 'adult-verification',
            description: 'Spawn in adult role request prompt.',
            type: CommandTypes.Subcommand,
            options: [
                {
                    name: 'request-processing-channel',
                    description: 'Where administrators can process the requests.',
                    type: CommandTypes.Channel,
                    required: true,
                },
                {
                    name: 'adult-role',
                    description: 'The role to give upon verification.',
                    type: CommandTypes.Role,
                    required: true,
                }
            ],
        },
        {
            name: 'prey-pile',
            description: 'Spawn in a visual prey pile.',
            type: CommandTypes.Subcommand,
            options: [
                {
                    name: 'clan',
                    description: 'The clan you wish to spawn the pile visual in.',
                    type: CommandTypes.String,
                    required: true,
                    choices: [
                        {
                            name: 'The Unforgiven',
                            value: 'unforgiven'
                        },
                        {
                            name: 'River-Clan',
                            value: 'riverclan'
                        },
                        {
                            name: 'Shadow-Clan',
                            value: 'shadowclan'
                        },
                        {
                            name: 'Thunder-Clan',
                            value: 'thunderclan'
                        },
                    ],
                },
            ],
        },
        {
            name: 'character-submissions',
            description: 'Spawn and configure Character Submissions.',
            type: CommandTypes.Subcommand,
            options: [
                {
                    name: 'submission-processing-channel',
                    description: 'Which channel to spawn threads for each day.',
                    type: CommandTypes.Channel,
                    required: true,
                }
            ],
        },
        {
            name: 'log',
            description: 'Spawn log channels.',
            type: CommandTypes.SubcommandGroup,
            options: [
                {
                    name: 'admin',
                    description: 'Set Admin Action Logging channel as the current.',
                    type: CommandTypes.Subcommand,
                },
                {
                    name: 'player',
                    description: 'Set Player Action Logging channel as the current.',
                    type: CommandTypes.Subcommand,
                },
            ]
        },
    ],
    /**@param {CommandInteraction} interaction */
    async execute(interaction) {

        // filter out non-administrators
        if (!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) return CoreUtil.InformNonAdministrator(interaction);

        // get subcommand and group
        const group = interaction.options.getSubcommandGroup(false);
        const subcommand = interaction.options.getSubcommand();

        // pull server from the database
        const server = CoreUtil.Servers.cache.get(interaction.guild.id);

        // catch groups
        switch (group) {
            case 'log': {
                switch (subcommand) {
                    case 'admin': {

                        // attach channel id
                        server.logging.admin = interaction.channel.id;
                        server.save();
                        break;
                        
                    } // end admin

                    case 'player': {

                        // attach channel id
                        server.logging.player = interaction.channel.id;
                        server.save();
                        break;

                    } // end player
                } // end log group

                // notify successful set
                return interaction.reply({
                    embeds: [new MessageEmbed({
                        color: 'GREEN',
                        title: '✅ Configuration Saved',
                        description: '`Admin Action Logging Channel`: ' + (server.logging.admin ? `<#${server.logging.admin}>` : '`None`')
                        + '\n`Player Action Logging Channel`: ' + (server.logging.player ? `<#${server.logging.player}>` : '`None`')
                    })]
                });

            } // end log case
        } // end group switch


        switch (subcommand) {
            case 'excuses': {
                // grab choice
                const processingChannel = interaction.options.getChannel('excuse-processing-channel');

                // ensure the channel is valid
                if (processingChannel.type !== ChannelType.GuildText) {
                    return interaction.reply({
                        ephemeral: true,
                        embeds: [new MessageEmbed()
                            .setColor('RED')
                            .setTitle('❗ Woah wait-!')
                            .setDescription('The channel must be a text channel, not a thread or category!')
                        ],
                    });
                }

                // finally, spawn the menu and provide a loading screen
                const menuMessage = interaction.channel.send({
                    embeds: [new MessageEmbed()
                        .setColor('BLURPLE')
                        .setTitle('📝 Excuse Form Requests')
                        .setDescription(
                            'Need to excuse yourself from a session? Running late or a little behind; need to leave early, perhaps?'
                            + '\n**No worries! We\'ve got you covered!**'
                            + '\n\nExcuse forms are readily available for any needs you may have. If you don\'t feel comfortable sharing the reason, that\'s perfectly fine! Please just let us know and we\'ll accomodate!'
                            + '\n\n💫 **Please keep in mind**'
                            + '\nEach excuse form is checked against the attendance for that given day. Sometimes this takes a while, we appreciate your patience 💚'
                            + '\n\n⏰**All excuses are due UP TO 4 hours after session end, after which submissions will be locked for review.**'
                            + '\n\n💡 **To get started, select the day you wish to fill out a form for. You will then be prompted for what kind of excuse you would like to submit, along with extra details.**'
                        )
                        .setFooter({ text: 'This menu is dynamically updated and all information displayed is up to date.' })
                    ],
                    components: [
                        new MessageActionRow({ components: ExcuseHandler.generateDayButtons(server) }),
                        new MessageActionRow({
                            components: [new MessageButton({
                                customId: 'EXCUSEBUTTON_VIEW',
                                style: ButtonStyle.Primary,
                                label: 'View the status of your excuses',
                                emoji: '📝'
                            })],
                        }),
                    ],
                });
                
                // defer and pull server from the cache
                await interaction.deferReply({ ephemeral: true });
                
                // save excuse menu channel/message id and processing channel id and notify
                ExcuseHandler.setMenuMessage(server, interaction.channel.id, (await menuMessage).id);
                ExcuseHandler.setProcessingChannel(server, processingChannel.id);
                await server.save();
                return interaction.editReply({
                    embeds: [new MessageEmbed()
                        .setColor('GREEN')
                        .setTitle('✅ Configuration Saved')
                        .setDescription('`Processing Channel`: <#' + processingChannel.id + '>')
                    ]
                });
            }

            case 'adult-verification': {
                // defer
                await interaction.deferReply({ ephemeral: true });

                // grab choice
                const requestChannel = interaction.channel;
                const processingChannel = interaction.options.getChannel('request-processing-channel');
                const adultRole = interaction.options.getRole('adult-role');
                                
                // spawn verification request and processing thread
                VerificationHandler.setAdultRole(server, adultRole.id);
                await VerificationHandler.spawnVerificationRequest(requestChannel);
                await VerificationHandler.spawnVerificationThread(server, processingChannel);
                await server.save();

                await interaction.editReply({
                    embeds: [new MessageEmbed()
                        .setColor('GREEN')
                        .setTitle('✅ Configuration Saved')
                        .setDescription(
                        '`Request Channel`: <#' + requestChannel.id + '>'
                        + '\n`Processing Channel`: <#' + processingChannel.id + '>'
                        + '\n`Adult Role`: <@&' + adultRole.id + '>'
                        )
                    ]
                });
            }

            case 'prey-pile': {

                // defer
                await interaction.deferReply({ ephemeral: true });

                // grab choice
                const clan = interaction.options.getString('clan');
                
                // set current channel to the corresponding clan's preyPileChannelId
                await PreyPile.setPreyPileChannelAndSpawn(interaction, server, clan);
                await server.save()
                    .then(console.log)
                    .catch(console.error);

                // notify successful set
                return interaction.editReply({
                    embeds: [new MessageEmbed()
                        .setColor('GREEN')
                        .setTitle('✅ Successfully spawned the prey pile')
                        .setDescription(`The prey pile for \`${clan.toUpperCase()}\` has been successfully spawned.\
                        \nBoth the channel and message have been saved, and any updates to it will be recorded within this channel and the existing message.\
                        \nThere are fall-backs in case there is any deletion.`)
                    ]
                });
            }

            case 'character-submissions': {
                // grab choice
                const processingChannel = interaction.options.getChannel('submission-processing-channel');

                // ensure the channel is valid
                if (processingChannel.type !== ChannelType.GuildText) {
                    return interaction.reply({
                        ephemeral: true,
                        embeds: [new MessageEmbed()
                            .setColor('RED')
                            .setTitle('❗ Woah wait-!')
                            .setDescription('The channel must be a text channel, not a thread or category!')
                        ],
                    });
                }

                // assign to server
                server.submissions.channelId = processingChannel.id;
                server.save();

                // spawn menu to open a submission
                interaction.channel.send({
                    embeds: [new MessageEmbed({
                        color: 'FUCHSIA',
                        title: '🗃️ Character Submission Information',
                        description: '> Welcome to **' + CoreUtil.roleplayName + '**! We\'re incredibly happy to have you join us!'
                        + '\n> \n> Before you can get started with roleplay sessions and all of the features provided by **' + interaction.client.user.username + '**, let\'s get you started in writing your own path in **' + CoreUtil.roleplayName
                        + '** by getting you on your way to penning your own character! There are just a few things you need to keep in mind while writing your character and whipping up their stats:',
                        fields: [
                            {
                                name: '__Stat Rules (Ages in Moons)__',
                                value: '__Kits__ (`<6`)\n> **10 MAX** stat points.'
                                + '\n\n__Apprentices__ (`6`-`11`)\n> **20 MAX** stat points.'
                                + '\n\n__Warriors__ (`12`-`50`)\n> **40 MAX** stat points.'
                                + '\n\n__Seasoned Warriors__ (`51`-`119`)\n> **45 MAX** stat points.'
                                + '\n\n__Elders__ (`120`-`Dead`)\n> **35 MAX** stat points.'
                                + '\n\n__Leaders__\n> **50 MAX** stat points.'
                                + '\n\n__Medicine Cats__\n> **35 MAX** as they are not as well trained as warriors, but know more than the average apprentice.'
                                + '\n\n**Stat points can be distributed however you wish between the 8 available stats on your character sheet:**'
                                + '\n> Strength, Dexterity, Constitution, Charisma, Speed, Swimming, Intelligence, Stalking.'
                                + '\n\nMake sure they add up to the total amount of stat points you have, not more, not less! Moon rules still apply even if you\'re an Unforgiven member.',
                                inline: true,
                            },
                            {
                                name: '__Submission Rules__',
                                value: '**1.** You **CANNOT** submit a character **UNTIL 24 HOURS** after you joined the server. This is to ensure you have enough time to truly delve deep into which character you would truly like to play during the roleplay session.'
                                + '\n\n**2.** After the previous stated 24 hours, you will be given **3 DAYS** to submit a character **before being kicked for inactivity.**'
                                + '\n\n**3.** You must look at the #CharacterTracker before submitting a character as well to make sure you have all the information needed.',
                                inline: true,
                            },
                        ]
                    })],
                    components: [new MessageActionRow({
                        components: [new MessageButton({
                            customId: 'CHARACTERSUBMISSION:OPEN',
                            label: 'Open Character Menu',
                            style: ButtonStyle.Primary,
                            emoji: '📝',
                        })]
                    })]
                });

                // inform success
                return interaction.reply({
                    ephemeral: true,
                    embeds: [new MessageEmbed({
                        color: 'GREEN',
                        title: '✅ Configuration Saved',
                        description: '`Processing Channel`: <#' + processingChannel.id + '>'
                    })]
                });
            }
        }
    },
};