const HuntManager = require('../../util/Hunting/HuntManager')
const PreyPile = require('../../util/Hunting/PreyPile')
const { ApplicationCommandOptionType : CommandTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const CANON_MESSAGE = '🍃 This message is canon.'

module.exports = {
    name: 'eat-from',
    description: 'Take food from a food source to try and satisfy your hunger.',
    options: [
        {
            name: 'back',
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
                    ]
                }
            ]
        },
        {
            name: 'prey-pile',
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
                    ]
                }
            ]
        }
        
    ],
    /**
     * @param {BaseCommandInteraction} interaction 
     */
    async execute(interaction) {

        // defer only if eating from the carried prey on one's back
        await interaction.deferReply({ ephemeral: interaction.options.getSubcommand() === 'back' });
        
        // pull user and server from the database
        const player = await HuntManager.FetchUser(interaction.user.id);
        if (!player) return await HuntManager.NotRegistered(interaction);

        // get server data
        const server = await PreyPile.FetchServer(interaction.guild.id);

        // if hunting is currently restricted, display warning
        if (server.hunting.locked) return await HuntManager.displayRestrictedHunting(interaction);
        
        // verify bites needed
        const bitesNeeded = Math.min(
            parseInt(interaction.options.getString('specific-amount', false) || '999'),
            player.currentHunger
        );

        // if not hungry, inform the user and return
        if (bitesNeeded < 1) {
            return interaction.editReply({
                embeds: [new MessageEmbed()
                    .setColor('AQUA')
                    .setTitle('🍖 Hmm...')
                    .setDescription('You are not really feeling hungry. Better to leave it for everyone else.')
                    .setFooter({ text: CANON_MESSAGE })
                ]
            });
        }

        // route to requested food source
        switch (interaction.options.getSubcommand()) {
            case 'back': {
                // if the player is not carrying anything, inform
                const inventoryEntry = HuntManager.getCarrying(interaction.user.id);
                if (inventoryEntry[0] < 1) return interaction.editReply({
                    embeds: [new MessageEmbed({
                        color: 'RED',
                        title: '🦴 Huh...',
                        description: '> Looks like you don\'t have much to eat on your back...'
                        + '\n> You can go out and `/hunt`, and `/carry` what you caught... then come back to this command to sneak a bite while no-one\'s looking...'
                        + '\n**This will leave bones behind for your clanmates to find.**',
                        footer: { text: CANON_MESSAGE },
                    })]
                });

                // eat prey being carried on one's back and format them properly
                const {bitesTaken, consumed} = HuntManager.pullFromCarrying(inventoryEntry, bitesNeeded);
                const consumedFormatted = consumed.map(({name, amountEaten}) => {
                    return `(\`${Number.isInteger(amountEaten) ? amountEaten : amountEaten.toFixed(2)}\`) **${name}**`
                }).join(', ');

                // update player's hunger based on total bites taken
                player.currentHunger -= bitesTaken;
                await player.save();
        
                // notify the clan bones were found
                const notifyEmbed = new MessageEmbed({
                    color: 'RED',
                    author: { name: '☠️ Some prey bones have been discovered...' },
                    description: '**Someone has been dishonest.** There '
                    + (consumed.length === 1 ? 'is `1` pair' : 'are `' + consumed.length + '` pairs') + ' of bones lying within the territory, slightly buried but not well enough.'
                });
                await PreyPile.pushPreyUpdateMessage(interaction, server, player.clan, {embeds: [notifyEmbed]});

                // display a summary of the prey eaten to the player
                const resultEmbed = new MessageEmbed({
                    color: 'DARK_GREEN',
                    title: '☠️🍴 Finally... food... but at what cost?',
                    description: '> You look around to make sure no one is looking... before taking some prey from your back and tearing into it, hastily hiding ' + (consumed.length === 1 ? 'all':'') + ' the pair' + (consumed.length !== 1 ? 's':'') + ' of bones of the ' + consumedFormatted + ' before anyone could catch on. However, they are still visible to a trained eye.\n\n'
                    + (
                        player.currentHunger < 1
                        ? 'You are fully satiated.'
                        : 'Just... `' + player.currentHunger + '` more bite' + player.currentHunger !== 1 ? 's':''
                    ) + '...',
                    footer: { text: CANON_MESSAGE },
                });
                return interaction.editReply({ embeds: [resultEmbed] });
            }
            
            case 'prey-pile': {
                // if the prey pile is empty, inform
                const preyPile = PreyPile.getPreyPile(clan, server);
                if (preyPile.length < 1) return interaction.editReply({
                    embeds: [new MessageEmbed({
                        color: 'RED',
                        title: '🦴 Wonderful...',
                        description: '> Looks like there\'s nothing to eat.'
                        + '\n> Someone didn\'t go on patrol. Go \`/hunt\` for more if your leader sends you out.',
                        footer: { text: CANON_MESSAGE },
                    })]
                });

                // pull and eat the amount, and update hunger
                const {bitesTaken, consumed} = PreyPile.pullFromPreyPile(clan, server, bitesNeeded);
                const consumedFormatted = consumed.map(({name, amountEaten}) => {
                    return `(\`${Number.isInteger(amountEaten) ? amountEaten : amountEaten.toFixed(2)}\`) **${name}**`
                }).join(', ');
                player.currentHunger = player.currentHunger - bitesTaken;

                // update prey pile and save user's new hunger
                await PreyPile.updatePreyPile(interaction, server, clan);
                await player.save();
                await server.save();

                // notify the clan
                const notifyEmbed = new MessageEmbed();
                if (player.clan == clan) {
                    notifyEmbed
                        .setColor('AQUA')
                        .setAuthor({name: '🦴 Some prey has been eaten', iconURL: interaction.member.displayAvatarURL()})
                        .setThumbnail('https://c.tenor.com/27kedvI8EwQAAAAd/cat-eating.gif')
                        .setDescription(`\
                        **${interaction.member.displayName}** has eaten some food from the prey pile.\
                        \n\
                        \n**- - - - - -**\
                        \n\
                        \n**They have eaten \`${bitesTaken}\` bite${bitesTaken != 1 ? 's' : ''} of food, and have consumed the following**:\
                        \n\
                        \n${consumedFormatted}\
                        \n\
                        \n**- - - - - -**`)
                        .setFooter({ text: CANON_MESSAGE });
                }
                else {
                    notifyEmbed
                        .setColor('RED')
                        .setTitle('❗⚠️ Some prey has possibly been stolen!')
                        .setThumbnail('https://www.wildliferemoval.com/wp-content/uploads/2019/02/Animal-Tracks.jpg')
                        .setDescription(`\
                        **An outsider to our clan has eaten from our prey pile!!**\
                        \n> The scent is coming from someone from **${player.clan.toUpperCase()}**.\
                        \n\
                        \n**SPOILER** \| WHO IT WAS: || ${interaction.member.displayName} ||
                        \n\
                        \n*(if someone has recently been given food, this can be ignored)*\
                        \n**- - - - - -**\
                        \n\
                        \n**They have eaten \`${bitesTaken}\` bite${bitesTaken != 1 ? 's' : ''} of food, and have consumed the following**:\
                        \n\
                        \n${consumedFormatted}\
                        \n\
                        \n**- - - - - -**`)
                        .setFooter({ text: CANON_MESSAGE });
                }
                await PreyPile.pushPreyUpdateMessage(interaction, server, clan, {embeds:[notifyEmbed]})

                // display a summary of the prey eaten to the player
                const resultEmbed = new MessageEmbed({
                    color: 'GREEN',
                    title: '🍴 __Finally, food.__',
                    description: `> ${consumed.length == 1 ? 'Y':'One after the other, y'}ou take ${consumedFormatted} between your teeth and tear into ${consumed.length == 1 ? 'it' : 'them'}, finally getting a good meal.`
                    + '\n> \n> ' + (
                        player.currentHunger < 1
                        ? 'You are fully satiated.'
                        : 'Just... `' + player.currentHunger + '` more bite' + player.currentHunger !== 1 ? 's':''
                    ) + '...',
                    footer: { text: CANON_MESSAGE }
                });
                return interaction.editReply({ embeds: [resultEmbed] });
            }
        }

    },
};