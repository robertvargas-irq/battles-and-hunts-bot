const HuntManager = require('../../util/Hunting/HuntManager')
const { ApplicationCommandOptionType : CommandTypes } = require('discord-api-types/v10');
const { CommandInteraction } = require('discord.js');
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
                            name: 'Barn',
                            value: 'barn',
                        },
                        {
                            name: 'By the Gorge',
                            value: 'gorge',
                        },
                        {
                            name: 'Outpost Rock',
                            value: 'outpost-rock',
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
                            name: 'Sandy Hollow',
                            value: 'sandy-hollow',
                        },
                        {
                            name: 'Snake Rocks',
                            value: 'snake-rocks',
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
                            name: 'Carrion Place',
                            value: 'carrion-place',
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
                            name: 'By the Thunderpath',
                            value: 'thunderpath',
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
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {

        // track territory
        const territory = interaction.options.getSubcommand();
        const location = interaction.options.getString('location');
        
        // get character from the cache
        const character = HuntManager.Characters.cache.get(interaction.guild.id, interaction.user.id);
        const member = HuntManager.Members.cache.get(interaction.guild.id, interaction.user.id);
        if (!character || !character.approved) return HuntManager.NotRegistered(interaction);

        // pull the server from the database
        const server = HuntManager.Servers.cache.get(interaction.guild.id);

        // if not locked, session is active, so check cooldowns
        if (!server.hunting.locked) {
            // return if on cooldown
            if (HuntManager.onCooldownHunt(interaction.guild.id, interaction.user.id))
                return HuntManager.displayCooldownHunt(interaction);
            
            // add cooldown
            HuntManager.addCooldownHunt(interaction.guild.id, interaction.user.id);
        }

        // roll for track
        const trackRoll = HuntManager.rollTrack(20);
        const catchRoll = HuntManager.rollCatch(20);
        const prey = HuntManager.generatePrey(location, 3);

        // display result
        return HuntManager.generateAndDisplayResults(
            interaction,
            character,
            member,
            server,
            territory,
            location,
            trackRoll,
            catchRoll,
            prey
        );
    },
};