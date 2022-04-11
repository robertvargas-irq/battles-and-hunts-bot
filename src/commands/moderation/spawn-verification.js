const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed, Permissions } = require('discord.js');
const HuntManager = require('../../util/Hunting/HuntManager')
const PreyPile = require('../../util/Hunting/PreyPile');
const mongoose = require('mongoose');
const serverSchema = require('../../database/schemas/server');
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
    /**
     * @param {BaseCommandInteraction} interaction 
     */
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
        const Server = mongoose.model('Server', serverSchema);
        let server = await Server.findOne({ guildId: interaction.guild.id });
        if (!server) server = await Server.create({ guildId: interaction.guild.id });
        
        // spawn verification request and processing thread
        await VerificationHandler.spawnVerificationRequest(requestChannel);
        await VerificationHandler.spawnVerificationThread(server, processingChannel);
        await VerificationHandler.setAdultRole(server, adultRole.id);
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