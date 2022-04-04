// import { HuntManager } from '../../util/Hunting/HuntManager';
const HuntManager = require('../../util/Hunting/HuntManager')
const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, GuildMember, MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const firstTimeRegister = require('../../util/Account/firstTimeRegister');
const userSchema = require('../../database/schemas/user');
const huntChecks = require('../../util/Hunting/huntChecks.json');
const serverSchema = require('../../database/schemas/server');

module.exports = {
    name: 'carry',
    description: 'Put your most recently caught prey on your back.',
    guilds: ['957854680367648778', '954037682223316992'],
    /**
     * @param {BaseCommandInteraction} interaction 
     */
    async execute(interaction) {

        // defer
        await interaction.deferReply({ ephemeral: true });
        
        // pull user and server from the database
        const User = mongoose.model('User', userSchema);
        /**@type {mongoose.Document}*/ let hunter = await User.findOne({ userId: interaction.user.id }).exec();
        const Server = mongoose.model('Server', serverSchema);
        let server = await Server.findOne({ guildId: interaction.guild.id });
        if (!server) server = await Server.create({ guildId: interaction.guild.id });

        // prompt registration if user is not registered; then continue on
        if (!hunter) hunter = await firstTimeRegister(interaction);
        if (!hunter) return; // error message already handled in collect()

        // if not carrying anything, inform
        const recentlyCaught = HuntManager.getRecentlyCaught(interaction.user.id);
        if (!recentlyCaught) {
            return interaction.editReply({
                embeds: [new MessageEmbed()
                    .setColor('RED')
                    .setTitle('⚠️ Woah wait! You haven\'t caught anything!')
                    .setDescription(`\
                    > Go back and use \`/hunt\` first and then use this command to pick up and carry whatever you caught!
                    `)
                ]
            });
        }
        
        // add to carry
        const [ableToAdd, weightCarrying, preyCarrying] = HuntManager.addToCarry(interaction.user.id, recentlyCaught);
        const resultEmbed = new MessageEmbed();

        // if successful, notify
        if (ableToAdd) resultEmbed
            .setColor('GREEN')
            .setTitle(`🎒 __Successfully picked up: \`${recentlyCaught.name}\`__`)
            .setDescription(`\
            > You take the \`${recentlyCaught.name}\` between your teeth and chuck it onto your back, ready to carry it as you venture forward. 
            > 
            > Your back gets a little heavier.
            
            🐈 __**Prey you are currently carrying**__

            ${HuntManager.formatPrey(preyCarrying)}
            
            **- - - - - -**

            Total weight being carried: \`${weightCarrying}\` / \`${HuntManager.INVENTORY_MAX_WEIGHT}\`
            `);
        else resultEmbed
            .setColor('RED')
            .setTitle(`⚠️ __Hhh... this \`${recentlyCaught.name}\` is too heavy...__`)
            .setDescription(`\
            > You take the \`${recentlyCaught.name}\` between your teeth and chuck it onto your back, but it simply slides right off, nearly toppling the rest of the tower you have managed to create! 
            > 
            > You unfortunately must go back to camp and \`/deposit\` your prey before you can carry more.
            
            🐈 **Prey you are currently carrying**

            ${HuntManager.formatPrey(preyCarrying)}
            
            **- - - - - -**

            Total weight being carried: \`${weightCarrying}\` / \`${HuntManager.INVENTORY_MAX_WEIGHT}\`
            > (\`${weightCarrying}\` + \`${recentlyCaught.bites_remaining}\`) > \`${HuntManager.INVENTORY_MAX_WEIGHT}\`
            `)

        // display result
        return interaction.editReply({
            embeds: [resultEmbed]
        })
    },
};