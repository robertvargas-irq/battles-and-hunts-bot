const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed, Permissions } = require('discord.js');
const mongoose = require('mongoose');
const userSchema = require('../../database/schemas/user');

module.exports = {
    name: 'starve-all',
    description: '(🔒 ADMINISTRATOR ONLY) Set all player\'s hunger to MAX.',
    guilds: ['957854680367648778', '954037682223316992'],
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

        // get all users
        const User = mongoose.model('User', userSchema);
        const allUsers = await User.find();

        // set all user's hunger to their size
        for (let user of allUsers) user.currentHunger = user.stats.cat_size;

        // save all user documents
        await User.bulkSave(allUsers);

        // notify successful set
        return interaction.editReply({
            embeds: [new MessageEmbed()
                .setColor('GREEN')
                .setTitle('✅ Successfully set all user hungers to max.')
                .setDescription(
                `> **Hunger begins to bear down upon warriors great and small, leaders and young, and everyone in-between.**` +
                `\n\n > It is inescapable, as time ticks by, finding something suitable to \`/eat\` grows prevalent to satiate this growing \`/hunger\`...`
                )
            ]
        })
    },
};