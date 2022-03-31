const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const userSchema = require('../../database/schemas/user');
const firstTimeRegister = require('../../util/Account/firstTimeRegister');
const { formatStats } = require('../../util/Account/Player');

module.exports = {
    name: 'stats',
    description: 'Check out your stats (default)! Or another\'s (player)!',
    guilds: ['957854680367648778', '954037682223316992'],
    options: [
        {
            name: 'player',
            description: '(DEFAULT: YOURSELF) Examine your enemy.',
            type: dTypes.User,
            required: false,
        },
    ],
    /**@param {BaseCommandInteraction} interaction */
    async execute( interaction ) {

        // defer
        const otherPlayer = interaction.options.getMember('player', false);
        await interaction.deferReply({ ephemeral: true });
        
        // if user is registered
        const User = mongoose.model('User', userSchema);
        /**@type {mongoose.Document}*/ let found = await User.findOne({ userId: otherPlayer?.user?.id || interaction.user.id }).exec();

        // inform player is not valid
        if (!found && otherPlayer) return interaction.editReply({
                embeds: [new MessageEmbed()
                    .setColor('AQUA')
                    .setTitle('⚠️ Woah!')
                    .setDescription('That user has not set up their stats yet! Come back later or bug them to do so! 🌟')
                ]
            });

        // prompt registration if user is not registered; inform if registered
        if (!found) found = await firstTimeRegister(interaction);
        if (!found) return; // error has already been handled inside collect()

        // show success message
        let pseudoInteraction = interaction;
        if (otherPlayer) pseudoInteraction = {
            member: otherPlayer,
            user: otherPlayer.user,
            guild: otherPlayer.guild
        };
        interaction.editReply({
            embeds: [ formatStats(pseudoInteraction, found) ]
        });
    
    },
};