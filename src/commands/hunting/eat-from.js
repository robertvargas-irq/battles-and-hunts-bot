const { ApplicationCommandOptionType : CommandTypes } = require('discord-api-types/v10');
const { CommandInteraction, MessageEmbed } = require('discord.js');
const Eating = require('../../util/Hunting/Eating');
const Hunger = require('../../util/Hunting/Hunger');
const HungerVisuals = require('../../util/Hunting/HungerVisuals');
const HuntInventory = require('../../util/Hunting/HuntInventory');
const HuntManager = require('../../util/Hunting/HuntManager');
const PreyPile = require('../../util/Hunting/PreyPile');
const CANON_MESSAGE = '🍃 This message is canon.'

module.exports = {
    name: 'eat',
    description: 'Take food from a food source to try and satisfy your hunger.',
    options: [
        {
            name: 'carrying',
            description: '(This will leave behind bones) Secretly eat from the pile you are carrying on your back.',
            type: CommandTypes.Subcommand,
            options: [
                {
                    name: 'specific-amount',
                    description: 'Don\'t want to take all the food? How many bites will you eat?',
                    type: CommandTypes.String,
                    required: false,
                    choices: [
                        {
                            name: '1',
                            value: '1',
                        },
                        {
                            name: '2',
                            value: '2',
                        },
                        {
                            name: '3',
                            value: '3',
                        },
                        {
                            name: '4',
                            value: '4',
                        },
                        {
                            name: '5',
                            value: '5',
                        },
                    ]
                }
            ]
        },
        {
            name: 'clan',
            description: '(This will notify the clan!) Eat from a clan\'s prey pile!',
            type: CommandTypes.Subcommand,
            options: [
                {
                    name: 'clan-to-eat-from',
                    description: '(THIS WILL NOTIFY THE CLAN!!!) The territory you want to eat from.',
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
                {
                    name: 'specific-amount',
                    description: 'Don\'t want to take all the food? How many bites will you eat?',
                    type: CommandTypes.String,
                    required: false,
                    choices: [
                        {
                            name: '1',
                            value: '1',
                        },
                        {
                            name: '2',
                            value: '2',
                        },
                        {
                            name: '3',
                            value: '3',
                        },
                        {
                            name: '4',
                            value: '4',
                        },
                        {
                            name: '5',
                            value: '5',
                        },
                    ]
                }
            ]
        }
        
    ],
    /**
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {

        // hide if eating from the carried prey on one's back
        const ephemeral = interaction.options.getSubcommand() === 'carrying';
        
        // pull character and server from the database
        const character = HuntManager.Characters.cache.get(interaction.guild.id, interaction.user.id);
        if (!character || !character.approved) return HuntManager.NotRegistered(interaction);
        const server = HuntManager.Servers.cache.get(interaction.guild.id);

        // if hunting is currently restricted, display warning
        if (server.hunting.locked) return HuntManager.displayRestrictedHunting(interaction);
        
        // verify bites needed
        const bitesNeeded = Math.min(
            parseInt(interaction.options.getString('specific-amount', false) || '999'),
            Hunger.bitesToSatisfy(character)
        );

        // if not hungry, inform the user and return
        if (bitesNeeded < 1) return Eating.informNotHungry(interaction, character);

        // route to requested food source
        switch (interaction.options.getSubcommand()) {
            case 'carrying': {
                // if the player is not carrying anything, inform
                const inventoryEntry = HuntInventory.getCarrying(interaction.guild.id, interaction.user.id);
                if (inventoryEntry[0] < 1) return interaction.reply({
                    ephemeral,
                    embeds: [
                        Eating.noFoodOnBackEmbed,
                        HungerVisuals.generateHungerEmbed(interaction.member, character),
                    ]
                });

                // eat prey being carried on one's back and format them properly
                const {bitesTaken, consumed} = HuntInventory.eatFromCarrying(inventoryEntry, bitesNeeded);

                // update player's hunger based on total bites taken
                Hunger.satiateHunger(character, bitesTaken);
                Hunger.markLastAte(character);
                character.save();
        
                // notify the clan bones were found
                PreyPile.pushPreyUpdateMessage(interaction, server, character.clan, {embeds: [
                    Eating.generateDishonestAlertEmbed(consumed)
                ]});

                // display a summary of the prey eaten to the playe
                return interaction.reply({
                    ephemeral,
                    embeds: [
                        Eating.generateDishonestResultEmbed(character, consumed),
                        HungerVisuals.generateHungerEmbed(interaction.member, character),
                    ]
                });
            }
            
            case 'clan': {
                // get clan
                const clan = interaction.options.getString('clan-to-eat-from');

                // if the prey pile is empty, inform
                const preyPile = PreyPile.getPreyPile(clan, server);
                if (preyPile.length < 1) return interaction.reply({
                    ephemeral,
                    embeds: [
                        Eating.noFoodInPileEmbed,
                        HungerVisuals.generateHungerEmbed(interaction.member, character),
                    ]
                });

                // pull and eat the amount, and update hunger
                const {bitesTaken, consumed} = PreyPile.pullFromPreyPile(clan, server, bitesNeeded);
                Hunger.satiateHunger(character, bitesTaken);
                Hunger.markLastAte(character);
                
                // update prey pile and save user's new hunger with eat time
                PreyPile.updatePreyPile(interaction, server, clan);
                character.save();
                server.save();

                // notify the clan                
                PreyPile.pushPreyUpdateMessage(interaction, server, clan, {embeds:[
                    Eating.generatePreyEatenClanAlertEmbed(character, interaction.member, clan, bitesTaken, consumed)
                ]});

                // display a summary of the prey eaten to the player
                interaction.reply({
                    ephemeral,
                    embeds: [
                        Eating.generateHonestResultEmbed(character, consumed),
                        HungerVisuals.generateHungerEmbed(interaction.member, character),
                    ]
                });
            }
        }

    },
};