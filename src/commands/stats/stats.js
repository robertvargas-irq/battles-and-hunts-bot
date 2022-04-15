const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed, GuildMember } = require('discord.js');
const { formatStats } = require('../../util/Account/Player');
const CoreUtil = require('../../util/CoreUtil');

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

        // defer reply
        await interaction.deferReply({ ephemeral: true });

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

        // show success message
        let pseudoInteraction = interaction;
        if (playerMember) pseudoInteraction = {
            member: playerMember,
            user: playerMember.user,
            guild: playerMember.guild
        };
        return interaction.editReply({
            embeds: [ formatStats(pseudoInteraction, found) ]
        });
    
    },
};