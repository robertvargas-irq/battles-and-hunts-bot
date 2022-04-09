const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed, Permissions } = require('discord.js');
const HuntManager = require('../../util/Hunting/HuntManager')
const PreyPile = require('../../util/Hunting/PreyPile');
const mongoose = require('mongoose');
const serverSchema = require('../../database/schemas/server');
const userSchema = require('../../database/schemas/user');

module.exports = {
    name: 'audit-registration',
    description: '(🔒 ADMINISTRATOR ONLY) Check to see which users are not registered for the bot.',
    guilds: ['957854680367648778', '954037682223316992'],
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
    /**
     * @param {BaseCommandInteraction} interaction 
     */
    async execute(interaction) {

        // get options then defer appropriately
        const ping = interaction.options.getString("ping-them") == 'yes';
        const private =  interaction.options.getString("view-privately") == 'yes';
        await interaction.deferReply({
            ephemeral: private
        });

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
        const Server = mongoose.model('Server', serverSchema);
        let server = await Server.findOne({ guildId: interaction.guild.id });
        if (!server) server = await Server.create({ guildId: interaction.guild.id });

        // get all users from the database and members from the guild
        const User = mongoose.model('User', userSchema);
        const [allUsers, Members] = await Promise.all([
            await User.find().then(f => { return new Set(f.map(o => o.userId)) }),
            await interaction.guild.members.fetch()
        ]);

        console.log({ allUsers, Members });

        // compare and only push members that are not registered
        const nonRegistered = [];
        for (let [id, member] of Members) {
            if (member.user.bot) continue;
            console.log(id);
            if (!allUsers.has(id))
                nonRegistered.push(member);
        }

        // notify successful set
        return interaction.editReply({
            content: (ping)
            ? "**Don't forget to `/register` for the bot when you can!**\n||"
            + nonRegistered.map(m => "<@" + m.user.id + ">").join('')
            + "||" : null,
            embeds: [new MessageEmbed()
                .setColor('GREEN')
                .setTitle('✅ Audit complete.')
                .setDescription("__**Non-Registered Users:**__\n>>> " +
                    nonRegistered.map(m => m.displayName).join('\n')
                )
            ]
        })
    },
};