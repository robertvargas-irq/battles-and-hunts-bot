const { ApplicationCommandOptionType: dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const days = [
    {
        name: 'Friday',
        value: 'friday',
    },
    {
        name: 'Saturday',
        value: 'saturday',
    },
    {
        name: 'Sunday',
        value: 'sunday',
    },
]

module.exports = {
    name: 'excused',
    description: 'Submit an excuse form for an upcoming roleplay.',
    options: [
        {
            type: dTypes.Subcommand,
            name: 'absence',
            description: 'Submit an absence form.',
            options: [
                {
                    type: dTypes.String,
                    name: 'day',
                    description: 'Which day you will be absent.',
                    required: true,
                    choices: days
                },
                {
                    type: dTypes.String,
                    name: 'reason',
                    description: 'ONLY ONE ABSENCE FORM PER DAY.',
                    required: true,
                },
            ],
        },
        {
            type: dTypes.Subcommand,
            name: 'late',
            description: 'Submit a late form.',
            options: [
                {
                    type: dTypes.String,
                    name: 'day',
                    description: 'Which day you will be late.',
                    required: true,
                    choices: days
                },
                {
                    type: dTypes.String,
                    name: 'reason',
                    description: 'ONLY ONE LATE FORM PER DAY.',
                    required: true,
                },
            ],
        },
        {
            type: dTypes.Subcommand,
            name: 'early-leave',
            description: 'Submit an early-leave form.',
            options: [
                {
                    type: dTypes.String,
                    name: 'day',
                    description: 'Which day you will be leaving early.',
                    required: true,
                    choices: days
                },
                {
                    type: dTypes.String,
                    name: 'reason',
                    description: 'ONLY ONE EARLY-LEAVE FORM PER DAY.',
                    required: true,
                },
            ],
        },
    ],
    /** @param {BaseCommandInteraction} interaction */
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const formType = interaction.options.getSubcommandGroup();
        const formDay = interaction.options.getSubcommand();
        const reason = interaction.options.getString('reason');

        switch (formType) {
            case 'absence':
                break;
            case 'late':
                break;
            case 'early-leave':
                break;
        }
    }
}