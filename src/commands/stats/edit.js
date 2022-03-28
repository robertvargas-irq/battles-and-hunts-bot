const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, Interaction } = require('discord.js');
const mongoose = require('mongoose');
const collectCharacterStats = require('../../util/Account/collectCharacterStats');
const userSchema = require('../../database/schemas/user');
module.exports = {
    name: 'edit',
    description: 'Edit your stats!',
    guilds: ['957854680367648778'],
    /**@param {BaseCommandInteraction} interaction */
    async execute( interaction ) {

        // if user is registered
        // const User = mongoose.model('User', userSchema);
        // const found = await User.findOne({ userId: interaction.user.id }).exec();
        
        await interaction.deferReply({ ephemeral: true });
        collectCharacterStats(interaction);
    },
};