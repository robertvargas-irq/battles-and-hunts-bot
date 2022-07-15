const { ButtonInteraction, MessageEmbed } = require('discord.js');
const HuntManager = require('../../../../util/Hunting/HuntManager');
const SharePool = require('../../../../util/Hunting/SharePool');
const HuntInventory = require('../../../../util/Hunting/HuntInventory');

/** @param {ButtonInteraction} button */
module.exports = async (button) => {

    // get user and server from the cache
    const hunter = HuntManager.Characters.cache.get(button.guild.id, button.user.id);
    if (!hunter || !hunter.approved) return HuntManager.NotRegistered(button);
    const server = HuntManager.Servers.cache.get(button.guild.id);

    // if hunting is currently restricted, display warning
    if (server.hunting.locked) return HuntManager.displayRestrictedHunting(button);
    
    // route to action
    switch(button.customId.split(':')[1]) {
        case 'COLLECT': {
            // check if the message is in the share pool or a recently caught
            const sharePoolPrey = SharePool.getShared(button.message);
            const recentlyCaught = HuntManager.getRecentlyCaught(button.guild.id, button.message.id);

            console.log({sharePoolPrey, recentlyCaught});

            // if no longer valid, wither
            if (!sharePoolPrey && !recentlyCaught) {
                button.deferUpdate();
                SharePool.removeShared(button.guild.id, button.message.id);
                return SharePool.witherPrey(button.message);
            }

            // if in share pool, carry
            if (sharePoolPrey) {
                const [overEncumbered, weightCarrying, currentlyCarrying] = HuntInventory.addToCarry(button.guild.id, button.user.id, sharePoolPrey, button.message);
                const resultEmbed = new MessageEmbed();

                // if successfully carried, notify
                if (!overEncumbered) {
                    // if weight being carried is at a respectable limit
                    if (weightCarrying <= HuntInventory.INVENTORY_MAX_WEIGHT) resultEmbed
                        .setColor('GREEN')
                        .setTitle(`🎒 __Successfully picked up: \`${sharePoolPrey.name}\`__`)
                        .setDescription(
                        `> You take the \`${sharePoolPrey.name}\` between your teeth and chuck it onto your back, ready to carry it as you venture forward.`
                        + '\n> ' 
                        + '\n> Your back gets a little heavier.'
                        )
                        .setFooter({ text: '🍃 This carry is canon.' });
                    // else, the weight being carried is NOT at a respectable limit; the character is now over-encumbered
                    else resultEmbed
                        .setColor('ORANGE')
                        .setAuthor({ name: '❗ STATUS CHANGE: YOU ARE NOW OVER-ENCUMBERED!' })
                        .setTitle(`⚠️ __Hhh... this \`${sharePoolPrey.name}\` is so heavy...__`)
                        .setDescription(
                        `> You take the \`${sharePoolPrey.name}\` between your teeth and chuck it onto your back, your legs struggling to keep the load on your back afloat.`
                        + '\n> '
                        + '\n> **You now have no other choice but to go back to camp and \`/deposit\` your prey before you can carry more.**'
                        + `\n> (\`${weightCarrying}\` + \`${sharePoolPrey.bites_remaining}\`) > \`${HuntInventory.INVENTORY_MAX_WEIGHT}\``
                        )
                        .setFooter({ text: '🍃 This carry is canon.' });
                }
                // else, the carry was not successful and the player was already over-encumbered
                else resultEmbed
                    .setColor('RED')
                    .setAuthor({ name: '❌ YOU ARE OVER-ENCUMBERED!' })
                    .setTitle(`⚠️ __Hhh... this \`${sharePoolPrey.name}\` is too heavy...__`)
                    .setDescription(
                    `> You carefully take the \`${sharePoolPrey.name}\` between your teeth, but the sheer weight you are carrying simply causes you to let go, stumbling and nearly losing what you have piled onto your back.`
                    + '\n> '
                    + '\n> **You unfortunately must go back to camp and \`/deposit\` your prey before you can carry more.**'
                    + `\n> (\`${weightCarrying}\` + \`${sharePoolPrey.bites_remaining}\`) > \`${HuntInventory.INVENTORY_MAX_WEIGHT}\``
                    )
                    .setFooter({ text: '🍃 This carry is canon.' });
                
                SharePool.removeShared(button.guild.id, button.message.id);
                return button.reply({
                    ephemeral: true,
                    embeds: [
                        resultEmbed,
                        HuntInventory.generateCarryingEmbed(currentlyCarrying, weightCarrying)
                    ]
                });
            }

            // else, if recently caught, ensure it is the original author trying to collect
            if (recentlyCaught.originalMember.user.id != button.user.id) return button.reply({
                ephemeral: true,
                embeds: [new MessageEmbed({
                    color: 'RED',
                    title: '⚠️ You can only collect hunts you caught, or those that are shared.'
                })]
            });

            const [overEncumbered, weightCarrying, currentlyCarrying] = HuntInventory.addToCarry(button.guild.id, button.user.id, recentlyCaught.prey, button.message);
            const resultEmbed = new MessageEmbed();

            // if successfully carried, notify
            if (!overEncumbered) {
                // if weight being carried is at a respectable limit
                if (weightCarrying <= HuntInventory.INVENTORY_MAX_WEIGHT) resultEmbed
                    .setColor('GREEN')
                    .setTitle(`🎒 __Successfully picked up: \`${recentlyCaught.prey.name}\`__`)
                    .setDescription(
                    `> You take the \`${recentlyCaught.prey.name}\` between your teeth and chuck it onto your back, ready to carry it as you venture forward.`
                    + '\n> ' 
                    + '\n> Your back gets a little heavier.'
                    )
                    .setFooter({ text: '🍃 This carry is canon.' });
                // else, the weight being carried is NOT at a respectable limit; the character is now over-encumbered
                else resultEmbed
                    .setColor('ORANGE')
                    .setAuthor({ name: '❗ STATUS CHANGE: YOU ARE NOW OVER-ENCUMBERED!' })
                    .setTitle(`⚠️ __Hhh... this \`${recentlyCaught.prey.name}\` is so heavy...__`)
                    .setDescription(
                    `> You take the \`${recentlyCaught.prey.name}\` between your teeth and chuck it onto your back, your legs struggling to keep the load on your back afloat.`
                    + '\n> '
                    + '\n> **You now have no other choice but to go back to camp and \`/deposit\` your prey before you can carry more.**'
                    + `\n> (\`${weightCarrying}\` + \`${recentlyCaught.prey.bites_remaining}\`) > \`${HuntInventory.INVENTORY_MAX_WEIGHT}\``
                    )
                    .setFooter({ text: '🍃 This carry is canon.' });
            }
            // else, the carry was not successful and the player was already over-encumbered
            else resultEmbed
                .setColor('RED')
                .setAuthor({ name: '❌ YOU ARE OVER-ENCUMBERED!' })
                .setTitle(`⚠️ __Hhh... this \`${recentlyCaught.prey.name}\` is too heavy...__`)
                .setDescription(
                `> You carefully take the \`${recentlyCaught.prey.name}\` between your teeth, but the sheer weight you are carrying simply causes you to let go, stumbling and nearly losing what you have piled onto your back.`
                + '\n> '
                + '\n> **You unfortunately must go back to camp and \`/deposit\` your prey before you can carry more.**'
                + `\n> (\`${weightCarrying}\` + \`${recentlyCaught.prey.bites_remaining}\`) > \`${HuntInventory.INVENTORY_MAX_WEIGHT}\``
                )
                .setFooter({ text: '🍃 This carry is canon.' });
            
            SharePool.removeShared(button.guild.id, button.message.id);
            return button.reply({
                ephemeral: true,
                embeds: [
                    resultEmbed,
                    HuntInventory.generateCarryingEmbed(currentlyCarrying, weightCarrying),
                ]
            });
        }

        case 'SHARE': {
            SharePool.markSharedFromHunt(button, button.message);
            return;
        }

        case 'EAT': {
            return;
        }
    }
}