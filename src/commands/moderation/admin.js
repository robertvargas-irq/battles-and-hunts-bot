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
        }
    ],
    /**@param {BaseCommandInteraction} interaction */
    async execute(interaction) {
        console.log({interaction});
        
        // route
        const group = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();
        switch (group) {
            case 'excuses':
                return require('./admin-routes/admin-excuses')(interaction, subcommand);
            case 'audit':
                return require('./admin-routes/admin-audit')(interaction, subcommand);
        }

    },
};