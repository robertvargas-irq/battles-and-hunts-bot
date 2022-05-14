const HuntManager = require('../../util/Hunting/HuntManager')
const { BaseCommandInteraction, MessageEmbed } = require('discord.js');

module.exports = {
    name: 'carry',
    description: 'Put your most recently caught prey on your back.',
    /**
     * @param {BaseCommandInteraction} interaction 
     */
    async execute(interaction) {

        // defer
        await interaction.deferReply({ ephemeral: true });
        
        // pull user and server from the database
        const hunter = await HuntManager.FetchUser(interaction.user.id);
        if (!hunter) return await HuntManager.NotRegistered(interaction);
        const server = await HuntManager.FetchServer(interaction.guild.id);

        // if hunting is currently restricted, display warning
        if (server.hunting.locked) return await HuntManager.displayRestrictedHunting(interaction);
        
        // if not carrying anything, inform
        const recentlyCaughtResult = HuntManager.getRecentlyCaught(interaction.user.id);
        let recentlyCaught;
        let originalInteraction;
        if (!recentlyCaughtResult) {
            return interaction.editReply({
                embeds: [new MessageEmbed()
                    .setColor('RED')
                    .setTitle('⚠️ Woah wait! You haven\'t caught anything!')
                    .setDescription(
                        '> Go back and use \`/hunt\` first and then use this command to pick up and carry whatever you caught!'
                    )
                ]
            });
        }

        // check if user is on cooldown
        if (HuntManager.onCooldownDeposit(interaction.user.id))
            return HuntManager.displayCooldownDeposit(interaction);
        
        // attach recently caught and interaction to proper variables
        recentlyCaught = recentlyCaughtResult.prey;
        originalInteraction = recentlyCaughtResult.interaction;
        
        // add to carry
        const [ableToAdd, weightCarrying, preyCarrying] = HuntManager.addToCarry(interaction.user.id, recentlyCaught, originalInteraction);
        const resultEmbed = new MessageEmbed();

        // if successful, notify
        if (ableToAdd) resultEmbed
            .setColor('GREEN')
            .setTitle(`🎒 __Successfully picked up: \`${recentlyCaught.name}\`__`)
            .setDescription(
            `> You take the \`${recentlyCaught.name}\` between your teeth and chuck it onto your back, ready to carry it as you venture forward.`
            + '\n> ' 
            + '\n> Your back gets a little heavier.'
            + '\n\n🐈 __**Prey you are currently carrying**__'
            + `\n\n${HuntManager.formatPrey(preyCarrying)}`
            + '\n\n**- - - - - -**'
            + `\n\nTotal weight being carried: \`${weightCarrying}\` / \`${HuntManager.INVENTORY_MAX_WEIGHT}\``
            )
            .setFooter({ text: '🍃 This carry is canon.' });
        else resultEmbed
            .setColor('RED')
            .setTitle(`⚠️ __Hhh... this \`${recentlyCaught.name}\` is too heavy...__`)
            .setDescription(
            `> You take the \`${recentlyCaught.name}\` between your teeth and chuck it onto your back, but it simply slides right off, nearly toppling the rest of the tower you have managed to create!`
            + '\n> '
            + '\n> **You unfortunately must go back to camp and \`/deposit\` your prey before you can carry more.**'
            + '\n\n🐈 **Prey you are currently carrying**'
            + `\n\n${HuntManager.formatPrey(preyCarrying)}`
            + '\n\n**- - - - - -**'
            + `\n\nTotal weight being carried: \`${weightCarrying}\` / \`${HuntManager.INVENTORY_MAX_WEIGHT}\``
            + `\n> (\`${weightCarrying}\` + \`${recentlyCaught.bites_remaining}\`) > \`${HuntManager.INVENTORY_MAX_WEIGHT}\``
            )
            .setFooter({ text: '🍃 This carry is canon.' });

        // display result
        return interaction.editReply({
            embeds: [resultEmbed]
        });
    },
};