const HuntManager = require('../../util/Hunting/HuntManager')
const { CommandInteraction, MessageEmbed } = require('discord.js');
const HuntInventory = require('../../util/Hunting/HuntInventory');
const HuntCooldowns = require('../../util/Hunting/HuntCooldowns');

module.exports = {
    name: 'carry',
    description: 'Put your most recently caught prey on your back.',
    /**
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {

        // get user and server from the cache
        const hunter = HuntManager.Characters.cache.get(interaction.guild.id, interaction.user.id);
        if (!hunter || !hunter.approved) return HuntManager.NotRegistered(interaction);
        const server = HuntManager.Servers.cache.get(interaction.guild.id);

        // if hunting is currently restricted, display warning
        if (server.hunting.locked) return HuntManager.displayRestrictedHunting(interaction);
        
        // if not carrying anything, inform
        const recentlyCaughtResult = HuntManager.getRecentlyCaught(interaction.guild.id, interaction.user.id);
        let recentlyCaught;
        let originalInteraction;
        if (!recentlyCaughtResult) {
            const [weightCarrying, preyCarrying] = HuntInventory.getCarrying(interaction.guild.id, interaction.user.id);
            return interaction.reply({
                ephemeral: true,
                embeds: [
                    new MessageEmbed({
                        color: 'RED',
                        title: '⚠️ Woah wait! You haven\'t caught anything!',
                        description: '> Go back and use \`/hunt\` first and then use this command to pick up and carry whatever you caught!',
                    }),
                    HuntInventory.generateCarryingEmbed(preyCarrying, weightCarrying),
                ]
            });
        }

        // check if user is on cooldown
        if (HuntCooldowns.onCooldownDeposit(interaction.guild.id, interaction.user.id))
            return HuntCooldowns.displayCooldownDeposit(interaction);
        
        // attach recently caught and interaction to proper variables
        recentlyCaught = recentlyCaughtResult.prey;
        originalInteraction = recentlyCaughtResult.interaction;
        
        // add to carry
        const [overEncumbered, weightCarrying, preyCarrying] = HuntInventory.addToCarry(interaction.guild.id, interaction.user.id, recentlyCaught, originalInteraction);
        const resultEmbed = new MessageEmbed();

        // if successfully carried, notify
        if (!overEncumbered) {
            // if weight being carried is at a respectable limit
            if (weightCarrying <= HuntInventory.INVENTORY_MAX_WEIGHT) resultEmbed
                .setColor('GREEN')
                .setTitle(`🎒 __Successfully picked up: \`${recentlyCaught.name}\`__`)
                .setDescription(
                `> You take the \`${recentlyCaught.name}\` between your teeth and chuck it onto your back, ready to carry it as you venture forward.`
                + '\n> ' 
                + '\n> Your back gets a little heavier.'
                )
                .setFooter({ text: '🍃 This carry is canon.' });
            // else, the weight being carried is NOT at a respectable limit; the character is now over-encumbered
            else resultEmbed
                .setColor('ORANGE')
                .setAuthor({ name: '❗ STATUS CHANGE: YOU ARE NOW OVER-ENCUMBERED!' })
                .setTitle(`⚠️ __Hhh... this \`${recentlyCaught.name}\` is so heavy...__`)
                .setDescription(
                `> You take the \`${recentlyCaught.name}\` between your teeth and chuck it onto your back, your legs struggling to keep the load on your back afloat.`
                + '\n> '
                + '\n> **You now have no other choice but to go back to camp and \`/deposit\` your prey before you can carry more.**'
                + `\n> (\`${weightCarrying}\` + \`${recentlyCaught.bites_remaining}\`) > \`${HuntInventory.INVENTORY_MAX_WEIGHT}\``
                )
                .setFooter({ text: '🍃 This carry is canon.' });
        }
        // else, the carry was not successful and the player was already over-encumbered
        else resultEmbed
            .setColor('RED')
            .setAuthor({ name: '❌ YOU ARE OVER-ENCUMBERED!' })
            .setTitle(`⚠️ __Hhh... this \`${recentlyCaught.name}\` is too heavy...__`)
            .setDescription(
            `> You carefully take the \`${recentlyCaught.name}\` between your teeth, but the sheer weight you are carrying simply causes you to let go, stumbling and nearly losing what you have piled onto your back.`
            + '\n> '
            + '\n> **You unfortunately must go back to camp and \`/deposit\` your prey before you can carry more.**'
            + `\n> (\`${weightCarrying}\` + \`${recentlyCaught.bites_remaining}\`) > \`${HuntInventory.INVENTORY_MAX_WEIGHT}\``
            )
            .setFooter({ text: '🍃 This carry is canon.' });

        // display result
        return interaction.reply({
            ephemeral: true,
            embeds: [
                resultEmbed,
                HuntInventory.generateCarryingEmbed(preyCarrying, weightCarrying)
            ]
        });
    },
};