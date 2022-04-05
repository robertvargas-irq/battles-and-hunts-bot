// import { HuntManager } from '../../util/Hunting/HuntManager';
const HuntManager = require('../../util/Hunting/HuntManager')
const PreyPile = require('../../util/Hunting/PreyPile')
const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, GuildMember, MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const firstTimeRegister = require('../../util/Account/firstTimeRegister');
const userSchema = require('../../database/schemas/user');
const huntChecks = require('../../util/Hunting/huntChecks.json');
const serverSchema = require('../../database/schemas/server');

module.exports = {
    name: 'eat',
    description: 'Take food from the prey pile to try and satisfy your hunger.',
    guilds: ['957854680367648778', '954037682223316992'],
    options: [
        {
            name: 'clan-to-eat-from',
            description: '(THIS WILL NOTIFY THE CLAN!!!) The territory you want to eat from.',
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
        {
            name: 'specific-amount',
            description: 'Don\'t want to take all the food? How many bites will you eat?',
            type: dTypes.String,
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
    ],
    /**
     * @param {BaseCommandInteraction} interaction 
     */
    async execute(interaction) {

        // defer
        await interaction.deferReply({ ephemeral: false });

        // get clan
        const clan = interaction.options.getString('clan-to-eat-from')
        
        // pull user and server from the database
        const User = mongoose.model('User', userSchema);
        const player = await User.findOne({ userId: interaction.user.id }).exec();

        // prompt registration if user is not registered; then continue on
        if (!player) player = await firstTimeRegister(interaction);
        if (!player) return; // error message already handled in collect()
        
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
                ]
            });
        }

        // get server data
        const Server = mongoose.model('Server', serverSchema);
        let server = await Server.findOne({ guildId: interaction.guild.id });
        if (!server) server = await Server.create({ guildId: interaction.guild.id });

        // if the prey pile is empty, inform
        const preyPile = PreyPile.getPreyPile(clan, server);
        if (preyPile.length < 1) {
            return interaction.editReply({
                embeds: [new MessageEmbed()
                    .setColor('RED')
                    .setTitle('🦴 Wonderful...')
                    .setDescription(`\
                    \n> Looks like there's nothing to eat.\
                    \n> Someone didn\'t go on patrol. Go \`/hunt\` for more if your leader sends you out.
                    `)
                ]
            });
        }
        
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
                .setTitle('🦴 Some prey has been eaten')
                .setDescription(`\
                ${interaction.member.displayName} has eaten some food from the prey pile.\
                \n\
                \n**- - - - - -**\
                \n\
                \n**They have eaten \`${bitesTaken}\` bite${bitesTaken != 1 ? 's' : ''} of food, and have consumed the following**:\
                \n\
                \n${consumedFormatted}\
                \n\
                \n**- - - - - -**`);
        }
        else {
            notifyEmbed
                .setColor('RED')
                .setTitle('❗⚠️ Some prey has possibly been stolen!')
                .setDescription(`\
                **An outsider to our clan has eaten from our prey pile!!**\
                \n> The scent is coming from someone from **${player.clan.toUpperCase()}**.\
                \n\
                \n*(if someone has recently been given food, this can be ignored)*\
                \n**- - - - - -**\
                \n\
                \n**They have eaten \`${bitesTaken}\` bite${bitesTaken != 1 ? 's' : ''} of food, and have consumed the following**:\
                \n\
                \n${consumedFormatted}\
                \n\
                \n**- - - - - -**`);
        }
        await PreyPile.pushPreyUpdateMessage(interaction, server, clan, {embeds:[notifyEmbed]})

        // notify of eaten prey
        const resultEmbed = new MessageEmbed()
            .setColor('GREEN')
            .setTitle(`🍴 __Finally, food.__`)
            .setDescription(`\
            > ${consumed.length == 1 ? 'Y':'One after the other, y'}ou take ${consumedFormatted} between your teeth and tear into ${consumed.length == 1 ? 'it' : 'them'}, finally getting a good meal.
            > 
            > ${player.currentHunger < 1 ? 'You are fully satiated.' : `Just... \`${player.currentHunger}\` more bite${player.currentHunger != 1 ? 's' : ''}...`}
            `)

        // display result
        return interaction.editReply({
            embeds: [resultEmbed]
        })
    },
};