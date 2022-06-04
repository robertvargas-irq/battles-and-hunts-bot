const { ApplicationCommandOptionType : CommandTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed, GuildMember } = require('discord.js');
const Player = require('../../util/Account/Player');
const HuntManager = require('../../util/Hunting/HuntManager');
const CoreUtil = require('../../util/CoreUtil');

module.exports = {
    name: 'stats',
    description: 'Check out your stats (default)! Or another\'s (player)!',
    options: [
        {
            name: 'general',
            description: 'Check out you or another\'s general character stats!',
            type: CommandTypes.Subcommand,
            options: [
                {
                    name: 'player',
                    description: '(DEFAULT: YOURSELF) Examine your enemy.',
                    type: CommandTypes.User,
                    required: false,
                },
            ]
        },
        {
            name: 'hunting',
            description: 'Check out you or another\'s hunting stats and contributions!',
            type: CommandTypes.Subcommand,
            options: [
                {
                    name: 'player',
                    description: '(DEFAULT: YOURSELF) Examine another\'s contributions.',
                    type: CommandTypes.User,
                    required: false,
                },
            ]
        }
    ],
    /**@param {BaseCommandInteraction} interaction */
    async execute(interaction) {

        // defer reply and get stat type requested
        await interaction.deferReply({ ephemeral: true });
        const statsType = interaction.options.getSubcommand();

        /**
         * @type {GuildMember}
         * Target's player member  */
        const playerMember = interaction.options.getMember('player', false) || interaction.member;

        // if the target is a bot, inform that bots do not have stats
        if (playerMember.user.bot) return interaction.editReply({ embeds: [new MessageEmbed({ title: '🤖 These stats are too powerful!' })] });
        
        // fetch user from the database
        const found = await CoreUtil.FetchUser(playerMember.user.id);

        // if target is not registered, inform the user appropriately and return
        if (!found) {
            if (playerMember.user.id == interaction.user.id) CoreUtil.NotRegistered(interaction);
            else interaction.editReply({
                    embeds: [new MessageEmbed()
                        .setColor('AQUA')
                        .setTitle('⚠️ Woah!')
                        .setDescription('**That user has not set up their stats yet!**\nCome back later or bug them to do so! 🌟')
                    ]
                });
            return;
        }
        
        // display the requested stats
        switch (statsType) {
            case 'general': {
                // display general character stats
                return interaction.editReply({
                    embeds: [ Player.formatStats(playerMember, found, interaction.user.id) ]
                });
            }

            case 'hunting': {
                return interaction.editReply({
                    embeds: [ HuntManager.formatStats(found, playerMember) ]
                });
            }
        }

    
    },
};