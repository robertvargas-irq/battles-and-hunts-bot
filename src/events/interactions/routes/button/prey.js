const { ButtonInteraction, MessageEmbed } = require('discord.js');
const HuntManager = require('../../../../util/Hunting/HuntManager');
const SharePool = require('../../../../util/Hunting/SharePool');
const HuntInventory = require('../../../../util/Hunting/HuntInventory');
const Eating = require('../../../../util/Hunting/Eating');
const Hunger = require('../../../../util/Hunting/Hunger');
const HungerVisuals = require('../../../../util/Hunting/HungerVisuals');
const PreyPile = require('../../../../util/Hunting/PreyPile');

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

            // // console.log({sharePoolPrey, recentlyCaught});

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
                    if (weightCarrying <= HuntInventory.calculateCarryWeight(hunter)) resultEmbed
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
                        + `\n> (\`${weightCarrying}\` + \`${sharePoolPrey.bites_remaining}\`) > \`${HuntInventory.calculateCarryWeight(hunter)}\``
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
                    + `\n> (\`${weightCarrying}\` + \`${sharePoolPrey.bites_remaining}\`) > \`${HuntInventory.calculateCarryWeight(hunter)}\``
                    )
                    .setFooter({ text: '🍃 This carry is canon.' });
                
                SharePool.removeShared(button.guild.id, button.message.id);
                return button.reply({
                    ephemeral: true,
                    embeds: [
                        resultEmbed,
                        HuntInventory.generateCarryingEmbed(hunter, currentlyCarrying, weightCarrying)
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
                if (weightCarrying <= HuntInventory.calculateCarryWeight(hunter)) resultEmbed
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
                    + `\n> (\`${weightCarrying}\` + \`${recentlyCaught.prey.bites_remaining}\`) > \`${HuntInventory.calculateCarryWeight(hunter)}\``
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
                + `\n> (\`${weightCarrying}\` + \`${recentlyCaught.prey.bites_remaining}\`) > \`${HuntInventory.calculateCarryWeight(hunter)}\``
                )
                .setFooter({ text: '🍃 This carry is canon.' });
            
            SharePool.removeShared(button.guild.id, button.message.id);
            return button.reply({
                ephemeral: true,
                embeds: [
                    resultEmbed,
                    HuntInventory.generateCarryingEmbed(hunter, currentlyCarrying, weightCarrying),
                ]
            });
        }

        case 'SHARE': {

            // get prey information
            const preyInformation = HuntManager.getRecentlyCaught(button.guild.id, button.message.id);
            if (!preyInformation) {
                button.deferUpdate();
                return SharePool.witherPrey(button.message);
            }

            // ensure original member is the one clicking
            if (preyInformation.originalMember.user.id != button.user.id) return button.reply({
                ephemeral: true,
                embeds: [new MessageEmbed({
                    color: 'RED',
                    title: '⚠️ You can only eat from your own catches!',
                })]
            });            

            SharePool.markSharedFromHunt(button, button.message);
            return;
        }

        case 'EAT': {
            // get prey information
            const preyInformation = HuntManager.getRecentlyCaught(button.guild.id, button.message.id);
            // // console.log({preyInformation});
            if (!preyInformation) {
                button.deferUpdate();
                return SharePool.witherPrey(button.message);
            }

            // deconstruct
            const { prey, originalMember } = preyInformation;

            // ensure original member is the one clicking
            if (originalMember.user.id != button.user.id) return button.reply({
                ephemeral: true,
                embeds: [new MessageEmbed({
                    color: 'RED',
                    title: '⚠️ You can only eat from your own catches!',
                })]
            });

            // get character information
            const character = HuntManager.Characters.cache.get(button.guild.id, button.user.id);

            // iterate through the pile until prey is depleted or bites satisfied
            /**@type {prey} */
            if (Hunger.isSatiated(character)) return Eating.informNotHungry(button, character);
            const bitesToSatisfy = Hunger.bitesToSatisfy(character);
            const bitesTaken = Math.min(prey.bites_remaining, bitesToSatisfy);

            // mark as taken
            button.message.edit({
                embeds: [HuntManager.editToDisplayCarried(button.message.embeds[button.message.embeds.length - 1])],
                components: [],
            });

            // push update to clan
            // // console.log({button, server, characterclan: character.clan});
            PreyPile.pushPreyUpdateMessage(button, server, character.clan, {embeds: [
                Eating.generateDishonestAlertEmbed([prey])
            ]}).then(console.log).catch(console.error);

            // satiate and save to database
            Hunger.satiateHunger(character, bitesTaken);
            character.save();
            
            // show results
            return button.reply({
                ephemeral: true,
                embeds: [
                    Eating.generateDishonestResultEmbed(character, [{name: prey.name, amountEaten: 1}]),
                    HungerVisuals.generateHungerEmbed(button.member, character),
                ]
            });

        }
    }
}