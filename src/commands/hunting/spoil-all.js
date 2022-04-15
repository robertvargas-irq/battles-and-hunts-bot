const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed, Permissions } = require('discord.js');
const HuntManager = require('../../util/Hunting/HuntManager')
const PreyPile = require('../../util/Hunting/PreyPile');
const mongoose = require('mongoose');
const serverSchema = require('../../database/schemas/server');

module.exports = {
    name: 'spoil-all',
    description: '(🔒 ADMINISTRATOR ONLY) Spoil all food in all prey piles.',
    guilds: ['957854680367648778', '954037682223316992'],
    options: [
        {
            name: 'are-you-sure',
            description: '❗(🔒) Please ensure you are not calling this command by mistake.',
            type: dTypes.String,
            required: true,
            choices: [
                {
                    name: 'Yes',
                    value: 'yes'
                }
            ],
        },
    ],
    /**
     * @param {BaseCommandInteraction} interaction 
     */
    async execute(interaction) {

        // defer
        await interaction.deferReply({ ephemeral: false });

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

        // empty all entries
        for ([clanName, clanData] of Array.from(Object.entries(server.clans))) {
            const spoiledFood = PreyPile.emptyPreyPile(clanName, server);
            PreyPile.updatePreyPile(interaction, server, clanName);
            PreyPile.pushPreyUpdateMessage(interaction, server, clanName, {
                embeds: [new MessageEmbed()
                    .setColor('RED')
                    .setTitle('🪰🦴 All of your food has gone to waste.')
                    .setDescription(`The entirety of the prey pile has rotted away, leaving behind a foul odor that absolutely engulfs your sense of smell.` +
                    `\n\n__**All of the following prey has spoiled**__:\n${PreyPile.formatPrey(spoiledFood)}\n\n||**${interaction.member.displayName}** called the \`/spoil\` command.||`)
                ]
            })
        }

        // save to server
        await server.save();

        // notify successful set
        return interaction.editReply({
            embeds: [new MessageEmbed()
                .setColor('GREEN')
                .setTitle('✅ Successfully spoiled all prey piles.')
                .setDescription('As the moons pass, disease and rot takes away what little you have left.')
            ]
        })
    },
};