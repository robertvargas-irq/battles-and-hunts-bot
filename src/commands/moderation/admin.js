const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed, Permissions, MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const VerificationHandler = require('../../util/Verification/VerificationHandler');
const ExcuseHandler = require('../../util/Excused/ExcuseHandler');
const Excuse = require('../../database/schemas/excuse');
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
    description: '(🔒 ADMINISTRATOR ONLY) Administrator toolkit.',
    options: [
        {
            name: 'excuses',
            description: '(🔒 ADMINISTRATOR ONLY) Spawn and configure Excuses.',
            type: dTypes.SubcommandGroup,
            options: [
                {
                    name: 'clear',
                    description: 'Clear out a full day\'s worth of excuses.',
                    type: dTypes.Subcommand,
                    options: [
                        {
                            name: 'day',
                            description: 'Which day would you like to clear?',
                            required: true,
                            type: dTypes.String,
                            choices: DAY_CHOICES,
                        }
                    ]
                },
                {
                    name: 'pause',
                    description: 'Pause incoming requests.',
                    type: dTypes.Subcommand,
                    options: [
                        {
                            name: 'day',
                            description: 'Which day would you like to pause?',
                            required: true,
                            type: dTypes.String,
                            choices: DAY_CHOICES,
                        }
                    ],
                },
                {
                    name: 'unpause',
                    description: 'Resume incoming requests.',
                    type: dTypes.Subcommand,
                    options: [
                        {
                            name: 'day',
                            description: 'Which day would you like to unpause?',
                            required: true,
                            type: dTypes.String,
                            choices: DAY_CHOICES,
                        }
                    ],
                }
            ],
        },
        {
            name: 'audit',
            description: '(🔒 ADMINISTRATOR ONLY) Perform audits',
            type: dTypes.SubcommandGroup,
            options: [
                {
                    name: 'excuses',
                    description: 'Audit all excuses for a given day',
                    type: dTypes.Subcommand,
                    options: [
                        {
                            name: 'day',
                            description: 'Which day to audit',
                            required: true,
                            type: dTypes.String,
                            choices: DAY_CHOICES,
                        }
                    ]
                },
                {
                    name: 'registration',
                    description: '(🔒 ADMINISTRATOR ONLY) Check to see which users are not registered for the bot.',
                    type: dTypes.Subcommand,
                    options: [
                        {
                            name: 'ping-them',
                            description: '❗(🔒) If you wish to ping them all: YES. If you want to view quietly: NO.',
                            type: dTypes.String,
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
                            type: dTypes.String,
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
                }
            ]
        },
        {
            name: 'hunting',
            description: '(🔒 ADMINISTRATOR ONLY) Configure hunting.',
            type: dTypes.SubcommandGroup,
            options: [
                {
                    name: 'dc',
                    description: 'Change the Hunting DC (roll needed to successfully hunt)',
                    type: dTypes.Subcommand,
                    options: [
                        {
                            name: 'value',
                            description: 'Please enter a positive value for Hunting DC.',
                            type: dTypes.Integer,
                            required: true,
                        }
                    ]
                },
                {
                    name: 'starve-everyone',
                    description: '(🔒 ADMINISTRATOR ONLY) Set all player\'s hunger to 0.',
                    type: dTypes.Subcommand,
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
                },
                {
                    name: 'spoil-everything',
                    description: '(🔒 ADMINISTRATOR ONLY) Spoil all food in all prey piles.',
                    type: dTypes.Subcommand,
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
                },
                {
                    name: 'lock',
                    description: '(🔒 ADMINISTRATOR ONLY) Lock all the prey piles.',
                    type: dTypes.Subcommand,
                },
                {
                    name: 'unlock',
                    description: '(🔒 ADMINISTRATOR ONLY) Unlock all the prey piles.',
                    type: dTypes.Subcommand,
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
        }

    },
};