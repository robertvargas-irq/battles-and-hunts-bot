const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed, Permissions } = require('discord.js');
const CoreUtil = require('../../util/CoreUtil');

module.exports = {
    name: 'restrict-hunting',
    description: '(🔒 ADMINISTRATOR ONLY) Lock all the prey piles.',
    options: [
        {
            name: 'locks-enabled',
            description: '(🔒 ADMINISTRATOR ONLY) True to enable Hunt Locks | False to disable',
            type: dTypes.Boolean,
            required: true,
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
        const server = await CoreUtil.FetchServer(interaction.guild.id);

        // set locks
        const lock = interaction.options.getBoolean('locks-enabled');
        server.hunting.locked = lock;

        // save to server
        await server.save();

        // notify successful set
        return interaction.editReply({
            embeds: [new MessageEmbed()
                .setColor(lock ? 'YELLOW' : 'GREEN')
                .setTitle(
                    lock
                    ? '🔒 Hunting has been restricted.'
                    : '🔓 Hunting is now fully available.'
                )
                .setDescription(
                    lock
                    ? 'This is most likely due to the fact that the session is over.'
                    + '\n`/carry` `/deposit` `/eat` are now `disabled`.'
                    : 'This probably means that a session is about to start.'
                    + '\n`/carry` `/deposit` `/eat` are now `enabled`.'
                )
            ]
        })
    },
};