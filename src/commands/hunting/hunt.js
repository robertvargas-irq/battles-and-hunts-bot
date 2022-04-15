const HuntManager = require('../../util/Hunting/HuntManager')
const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction } = require('discord.js');

module.exports = {
    name: 'hunt',
    description: 'Hunt for food!',
    guilds: ['957854680367648778', '954037682223316992'],
    options: [
        {
            name: 'current-territory',
            description: 'The current territory you are hunting in.',
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
    /**
     * @param {BaseCommandInteraction} interaction 
     */
    async execute(interaction) {

        // defer
        await interaction.deferReply({ ephemeral: false });

        // track territory
        const territory = interaction.options.getString('current-territory');
        
        // pull user from the database
        const hunter = await HuntManager.FetchUser(interaction.user.id);
        if (!hunter) return await HuntManager.NotRegistered(interaction);
        const server = await HuntManager.FetchServer(interaction.guild.id);

        // roll for track
        const trackRoll = HuntManager.rollTrack(20);
        const catchRoll = HuntManager.rollCatch(20);
        const prey = HuntManager.generatePrey(territory, 3);

        // display result
        return HuntManager.generateAndDisplayResults(
            interaction,
            hunter,
            server,
            territory,
            trackRoll,
            catchRoll,
            prey
        );
    },
};