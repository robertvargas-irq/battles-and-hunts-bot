const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const {  } = require('discord.js');
const mongoose = require('mongoose');
const userSchema = require('../database/schemas/user');
module.exports = {
    name: 'attack',
    description: 'Attack another user!',
    guilds: ['957854680367648778'],
    options: [
        {
            name: 'opponent',
            description: 'The target of this attack.',
            type: dTypes.User
        },
    ],
    async execute( interaction ) {

        // if user is registered
        const User = mongoose.model('User', userSchema);
        const found = await User.findOne({ userId: interaction.user.id }).exec();
        

        await interaction.reply('Ping!');
        if ( interaction.user.id == process.env.OWNER_ID )
            await interaction.client.emit('guildMemberAdd', interaction.member );
    },
};