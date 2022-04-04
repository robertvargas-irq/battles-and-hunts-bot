// import { HuntManager } from '../../util/Hunting/HuntManager';
const HuntManager = require('../../util/Hunting/HuntManager')
const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, GuildMember, MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const firstTimeRegister = require('../../util/Account/firstTimeRegister');
const userSchema = require('../../database/schemas/user');
const huntChecks = require('../../util/Hunting/huntChecks.json');
const serverSchema = require('../../database/schemas/server');

const getRandom = (min, max) => { return Math.floor(Math.random() * (max + 1 - min) + min) }

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
        const User = mongoose.model('User', userSchema);
        /**@type {mongoose.Document}*/ let hunter = await User.findOne({ userId: interaction.user.id }).exec();
        const Server = mongoose.model('Server', serverSchema);
        let server = await Server.findOne({ guildId: interaction.guild.id });
        if (!server) server = await Server.create({ guildId: interaction.guild.id });

        // prompt registration if user is not registered; then continue on
        if (!hunter) hunter = await firstTimeRegister(interaction);
        if (!hunter) return; // error message already handled in collect()

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