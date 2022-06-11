const { ApplicationCommandOptionType : CommandTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed, Permissions } = require('discord.js');
const DAY_CHOICES = [
    {
        name: 'Friday',
        value: 'FRIDAY',
    },
    {
        name: 'Saturday',
        value: 'SATURDAY',
    },
    {
        name: 'Sunday',
        value: 'SUNDAY',
    },
];

module.exports = {
    name: 'admin',
    description: 'Administrator toolkit.',
    options: [
        {
            name: 'excuses',
            description: 'Spawn and configure Excuses.',
            type: CommandTypes.SubcommandGroup,
            options: [
                {
                    name: 'clear',
                    description: 'Clear out a full day\'s worth of excuses.',
                    type: CommandTypes.Subcommand,
                    options: [
                        {
                            name: 'day',
                            description: 'Which day would you like to clear?',
                            required: true,
                            type: CommandTypes.String,
                            choices: DAY_CHOICES,
                        }
                    ]
                },
                {
                    name: 'pause',
                    description: 'Pause incoming requests.',
                    type: CommandTypes.Subcommand,
                    options: [
                        {
                            name: 'day',
                            description: 'Which day would you like to pause?',
                            required: true,
                            type: CommandTypes.String,
                            choices: DAY_CHOICES,
                        }
                    ],
                },
                {
                    name: 'unpause',
                    description: 'Resume incoming requests.',
                    type: CommandTypes.Subcommand,
                    options: [
                        {
                            name: 'day',
                            description: 'Which day would you like to unpause?',
                            required: true,
                            type: CommandTypes.String,
                            choices: DAY_CHOICES,
                        }
                    ],
                }
            ],
        },
        {
            name: 'audit',
            description: 'Perform audits',
            type: CommandTypes.SubcommandGroup,
            options: [
                {
                    name: 'excuses',
                    description: 'Audit all excuses for a given day',
                    type: CommandTypes.Subcommand,
                    options: [
                        {
                            name: 'day',
                            description: 'Which day to audit',
                            required: true,
                            type: CommandTypes.String,
                            choices: DAY_CHOICES,
                        }
                    ]
                },
                {
                    name: 'registration',
                    description: 'Check to see which users are not registered for the bot.',
                    type: CommandTypes.Subcommand,
                    options: [
                        {
                            name: 'ping-them',
                            description: '❗(🔒) If you wish to ping them all: YES. If you want to view quietly: NO.',
                            type: CommandTypes.String,
                            required: true,
                            choices: [
                                {
                                    name: 'No',
                                    value: 'no'
                                },
                                {
                                    name: 'Yes',
                                    value: 'yes'
                                },
                            ],
                        },
                        {
                            name: 'view-privately',
                            description: '❗(🔒) If you wish to view this in a private message.',
                            type: CommandTypes.String,
                            required: true,
                            choices: [
                                {
                                    name: 'No',
                                    value: 'no'
                                },
                                {
                                    name: 'Yes',
                                    value: 'yes'
                                },
                            ],
                        },
                    ],
                },
                {
                    name: 'starvation',
                    description: 'Check to see which characters are about to starve...',
                    type: CommandTypes.Subcommand,
                },
                {
                    name: 'list-members',
                    description: 'List every single member registered to the bot.',
                    type: CommandTypes.Subcommand,
                }
            ]
        },
        {
            name: 'hunting',
            description: 'Configure hunting.',
            type: CommandTypes.SubcommandGroup,
            options: [
                {
                    name: 'dc',
                    description: 'Change the Hunting DC (roll needed to successfully hunt)',
                    type: CommandTypes.Subcommand,
                    options: [
                        {
                            name: 'value',
                            description: 'Please enter a positive value for Hunting DC.',
                            type: CommandTypes.Integer,
                            required: true,
                        }
                    ]
                },
                {
                    name: 'starve-everyone',
                    description: 'Set all player\'s hunger to 0.',
                    type: CommandTypes.Subcommand,
                    options: [
                        {
                            name: 'are-you-sure',
                            description: '❗(🔒) Please ensure you are not calling this command by mistake.',
                            type: CommandTypes.String,
                            required: true,
                            choices: [
                                {
                                    name: 'Yes',
                                    value: 'yes'
                                }
                            ],
                        },
                    ],
                },
                {
                    name: 'spoil-everything',
                    description: 'Spoil all food in all prey piles.',
                    type: CommandTypes.Subcommand,
                    options: [
                        {
                            name: 'are-you-sure',
                            description: '❗(🔒) Please ensure you are not calling this command by mistake.',
                            type: CommandTypes.String,
                            required: true,
                            choices: [
                                {
                                    name: 'Yes',
                                    value: 'yes'
                                }
                            ],
                        },
                    ],
                },
                {
                    name: 'lock',
                    description: 'Lock all the prey piles.',
                    type: CommandTypes.Subcommand,
                },
                {
                    name: 'unlock',
                    description: 'Unlock all the prey piles.',
                    type: CommandTypes.Subcommand,
                }
            ]
        },
        {
            name: 'stats',
            description: 'Configure stats.',
            type: CommandTypes.SubcommandGroup,
            options: [
                {
                    name: 'lock',
                    description: 'Re-lock everyone\'s stats.',
                    type: CommandTypes.Subcommand,
                },
                {
                    name: 'unlock',
                    description: 'Unlock someone\'s stats to allow a quick edit.',
                    type: CommandTypes.Subcommand,
                    options: [
                        {
                            name: 'user',
                            description: 'Who to allow to /edit their stats.',
                            type: CommandTypes.User,
                            required: true,
                        }
                    ]
                },
            ]
        },
        {
            name: 'refresh',
            description: 'Something not quite right?',
            type: CommandTypes.SubcommandGroup,
            options: [
                {
                    name: 'clan-affiliations',
                    description: 'Someone changed clans? Bot was down during it? Let\'s fix that!',
                    type: CommandTypes.Subcommand,
                }
            ]
        }
    ],
    /**@param {BaseCommandInteraction} interaction */
    async execute(interaction) {

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
        
        // route
        const group = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();
        switch (group) {
            case 'excuses':
                return require('./admin-routes/admin-excuses')(interaction, subcommand);
            case 'audit':
                return require('./admin-routes/admin-audit')(interaction, subcommand);
            case 'hunting':
                return require('./admin-routes/admin-hunting')(interaction, subcommand);
            case 'stats':
                return require('./admin-routes/admin-stats')(interaction, subcommand);
            case 'refresh':
                return require('./admin-routes/admin-refresh')(interaction, subcommand);
        }

    },
};