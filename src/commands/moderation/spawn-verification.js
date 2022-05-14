const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed, Permissions } = require('discord.js');
const VerificationHandler = require('../../util/Verification/VerificationHandler');

module.exports = {
    name: 'spawn-verification',
    description: '(🔒 ADMINISTRATOR ONLY) Spawn in adult role request prompt.',
    options: [
        {
            name: 'request-channel',
            description: '(🔒 ADMINISTRATOR ONLY) Where users can make a request.',
            type: dTypes.Channel,
            required: true,
        },
        {
            name: 'request-processing-channel',
            description: '(🔒 ADMINISTRATOR ONLY) Where administrators can process the requests.',
            type: dTypes.Channel,
            required: true,
        },
        {
            name: 'adult-role',
            description: '(🔒 ADMINISTRATOR ONLY) The role to give upon verification.',
            type: dTypes.Role,
            required: true,
        }
    ],
    /**@param {BaseCommandInteraction} interaction */
    async execute(interaction) {

        // defer
        await interaction.deferReply({ ephemeral: true });

        // grab choice
        const requestChannel = interaction.options.getChannel('request-channel');
        const processingChannel = interaction.options.getChannel('request-processing-channel');
        const adultRole = interaction.options.getRole('adult-role');

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
         
    },
};