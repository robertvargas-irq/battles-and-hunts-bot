const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed, Permissions } = require('discord.js');
const HuntManager = require('../../util/Hunting/HuntManager')
const PreyPile = require('../../util/Hunting/PreyPile');
const mongoose = require('mongoose');
const serverSchema = require('../../database/schemas/server');

module.exports = {
    name: 'spawn-prey-pile',
    description: '(🔒 ADMINISTRATOR ONLY) Spawn in a visual prey pile.',
    guilds: ['957854680367648778', '954037682223316992'],
    options: [
        {
            name: 'clan',
            description: '(🔒) The clan you wish to spawn the pile visual in.',
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
        await interaction.deferReply({ ephemeral: true });

        // grab choice
        const clan = interaction.options.getString('clan');

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
        })
    },
};