const HuntManager = require('../../util/Hunting/HuntManager')
const { ApplicationCommandOptionType : CommandTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction } = require('discord.js');
const LOCATION_TEMPLATE = {

}

module.exports = {
    name: 'hunt',
    description: 'Hunt for food!',
    options: [
        {
            name: 'unforgiven',
            description: 'Hunt within the Unforgiven\'s territory.',
            type: CommandTypes.Subcommand,
            options: [
                {
                    name: 'location',
                    description: 'Where within this territory you will be hunting.',
                    type: CommandTypes.String,
                    required: true,
                    choices: [
                        {
                            name: 'Outpost Rock',
                            value: 'outpost-rock',
                        },
                        {
                            name: 'By the gorge',
                            value: 'gorge',
                        },
                        {
                            name: 'Barn',
                            value: 'barn',
                        },
                    ]
                }
            ]
        },
        {
            name: 'thunderclan',
            description: 'Hunt within Thunderclan\'s territory.',
            type: CommandTypes.Subcommand,
            options: [
                {
                    name: 'location',
                    description: 'Where within this territory you will be hunting.',
                    type: CommandTypes.String,
                    required: true,
                    choices: [
                        {
                            name: 'Snake Rocks',
                            value: 'snake-rocks',
                        },
                        {
                            name: 'Sandy Hollow',
                            value: 'sandy-hollow',
                        },
                        {
                            name: 'By the Thunderpath',
                            value: 'thunderpath',
                        },
                    ]
                }
            ]
        },
        {
            name: 'shadowclan',
            description: 'Hunt within Shadowclan\'s territory.',
            type: CommandTypes.Subcommand,
            options: [
                {
                    name: 'location',
                    description: 'Where within this territory you will be hunting.',
                    type: CommandTypes.String,
                    required: true,
                    choices: [
                        {
                            name: 'Burnt Sycamore',
                            value: 'burnt-sycamore',
                        },
                        {
                            name: 'Pond',
                            value: 'pond',
                        },
                        {
                            name: 'Stream',
                            value: 'river',
                        },
                        {
                            name: 'Carrion Place',
                            value: 'carrion-place',
                        },
                    ]
                }
            ]
        },
        {
            name: 'riverclan',
            description: 'Hunt within Riverclan\'s territory.',
            type: CommandTypes.Subcommand,
            options: [
                {
                    name: 'location',
                    description: 'Where within this territory you will be hunting.',
                    type: CommandTypes.String,
                    required: true,
                    choices: [
                        {
                            name: 'River',
                            value: 'river',
                        }
                    ]
                }
            ]
        },
    ],
    /**
     * @param {BaseCommandInteraction} interaction 
     */
    async execute(interaction) {

        // defer
        await interaction.deferReply({ ephemeral: false });

        // track territory
        const territory = interaction.options.getSubcommand();
        const location = interaction.options.getString('location');
        
        // pull user from the database
        const hunter = await HuntManager.FetchUser(interaction.user.id);
        if (!hunter) return await HuntManager.NotRegistered(interaction);

        // pull the server from the database
        const server = await HuntManager.FetchServer(interaction.guild.id);

        // if not locked, session is active, so check cooldowns
        if (!server.hunting.locked) {
            // return if on cooldown
            if (HuntManager.onCooldownHunt(interaction.user.id))
                return HuntManager.displayCooldownHunt(interaction);
            
            // add cooldown
            HuntManager.addCooldownHunt(interaction.user.id);
        }

        // roll for track
        const trackRoll = HuntManager.rollTrack(20);
        const catchRoll = HuntManager.rollCatch(20);
        const prey = HuntManager.generatePrey(location, 3);

        // display result
        return HuntManager.generateAndDisplayResults(
            interaction,
            hunter,
            server,
            territory,
            location,
            trackRoll,
            catchRoll,
            prey
        );
    },
};