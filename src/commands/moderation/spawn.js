const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed, Permissions, MessageActionRow, MessageButton } = require('discord.js');
const VerificationHandler = require('../../util/Verification/VerificationHandler');
const ExcuseHandler = require('../../util/Excused/ExcuseHandler');

module.exports = {
    name: 'spawn',
    description: '(🔒 ADMINISTRATOR ONLY) Spawn in a specific prompt.',
    options: [
        {
            name: 'excuses',
            description: '(🔒 ADMINISTRATOR ONLY) Spawn and configure Excuses.',
            type: dTypes.Subcommand,
            options: [
                {
                    name: 'excuse-processing-channel',
                    description: 'Which channel to spawn threads for each day.',
                    type: dTypes.Channel,
                    required: true,
                }
            ],
        },
        {
            name: 'adult-verification',
            description: '(🔒 ADMINISTRATOR ONLY) Spawn in adult role request prompt.',
            type: dTypes.Subcommand,
            options: [
                {
                    name: 'request-processing-channel',
                    description: 'Where administrators can process the requests.',
                    type: dTypes.Channel,
                    required: true,
                },
                {
                    name: 'adult-role',
                    description: 'The role to give upon verification.',
                    type: dTypes.Role,
                    required: true,
                }
            ],
        },
        {
            name: 'prey-pile',
            description: '(🔒 ADMINISTRATOR ONLY) Spawn in a visual prey pile.',
            type: dTypes.Subcommand,
            options: [
                {
                    name: 'clan',
                    description: 'The clan you wish to spawn the pile visual in.',
                    type: dTypes.String,
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
        }
    ],
    /**@param {BaseCommandInteraction} interaction */
    async execute(interaction) {

        // filter out non-administrators
        if (!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
            return interaction.editReply({
                embeds: [new MessageEmbed()
                    .setColor('RED')
                    .setTitle('❗ Woah wait-!')
                    .setDescription(
                        `Sorry about that **${interaction.member.displayName}**! This command is for administrators only!`
                    )
                ]
            });
        }

        switch (interaction.options.getSubcommand()) {
            case 'excuses': {
                // grab choice
                const processingChannel = interaction.options.getChannel('excuse-processing-channel');

                // ensure the channel is valid
                if (processingChannel.type !== 'GUILD_TEXT') {
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
                interaction.channel.send({
                    embeds: [new MessageEmbed()
                        .setColor('BLURPLE')
                        .setTitle('Excuse Form Requests')
                        .setDescription('Sit sint tempor quis eu nisi cupidatat enim velit consequat reprehenderit. Mollit id ad excepteur anim elit cupidatat nulla aute Lorem fugiat. Voluptate eiusmod est officia culpa adipisicing ullamco. Deserunt amet anim incididunt tempor Lorem deserunt nostrud. Cupidatat do do nulla proident non consectetur esse sint. Qui ea exercitation Lorem incididunt commodo ut incididunt amet officia ipsum ullamco culpa.')
                    ],
                    components: [new MessageActionRow({
                        components: ExcuseHandler.days.map(day => new MessageButton({
                            customId: 'EXCUSEBUTTON:' + day.toUpperCase(),
                            style: 'PRIMARY',
                            label: day,
                        }))
                    })],
                });
                await interaction.deferReply({ ephemeral: true });
                
                // pull server from the database
                const server = await ExcuseHandler.FetchServer(interaction.guild.id);
                
                // save excuse processing channel id and notify
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
                
                // pull server from the database
                const server = await VerificationHandler.FetchServer(interaction.guild.id);
                
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
                
                // pull server from the database
                const server = await PreyPile.FetchServer(interaction.guild.id);

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
        }         
    },
};