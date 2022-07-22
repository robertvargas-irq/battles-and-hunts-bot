const { MessageEmbed } = require('discord.js');
const HungerVisuals = require('./HungerVisuals');
const CoreUtil = require('../CoreUtil');
const Hunger = require('./Hunger');

const CANON_MESSAGE = '🍃 This message is canon.'

class Eating {

    static notHungryEmbed = new MessageEmbed({
        color: 'AQUA',
        title: '🍖 Hmm...',
        description: 'You are not really feeling hungry. Better to leave it for everyone else.',
    });

    static noFoodOnBackEmbed = new MessageEmbed({
        color: 'RED',
        title: '🦴 Huh...',
        description: '> Looks like you don\'t have much to eat on your back...'
        + '\n> You can go out and `/hunt`, and collect what you caught... then come back to this command to sneak a bite while no-one\'s looking...'
        + '\n\n⚠️ **This will leave bones behind for your clanmates to find.**',
    });

    static noFoodInPileEmbed = new MessageEmbed({
        color: 'RED',
        title: '🦴 Wonderful...',
        description: '> Looks like there\'s nothing to eat.'
        + '\n> Someone didn\'t go on patrol. Go \`/hunt\` for more if your leader sends you out.',
    });

    static informNotHungry = (interaction, character) => CoreUtil.SafeReply(interaction, {
        ephemeral: true,
        embeds: [
            Eating.notHungryEmbed,
            HungerVisuals.generateHungerEmbed(interaction.member, character),
        ]
    });

    /**
     * Generate an alert embed for a clan pile when prey was eaten "Dishonestly"
     * @param {prey[]} consumed 
     */
    static generateDishonestAlertEmbed = (consumed) => new MessageEmbed({
        color: 'RED',
        author: { name: '☠️ Some prey bones have been discovered...' },
        description: '**Someone has been dishonest.** There '
        + (consumed.length === 1 ? 'is `1` pair' : 'are `' + consumed.length + '` pairs') + ' of bones lying within the territory, slightly buried but not well enough.'
    });

    /**
     * Format consumed prey into a human-readable sentence
     * @param {prey[]} consumed 
     */
    static formatConsumed = (consumed) => consumed.map(({name, amountEaten}) => {
        return `(\`${Number.isInteger(amountEaten) ? amountEaten : amountEaten.toFixed(2)}\`) **${name}**`
    }).join(', ');

    /**
     * Generate a post-eat summary for the user who ate "Dishonestly"
     * @param {CharacterModel} character 
     * @param {prey[]} consumed 
     */
    static generateDishonestResultEmbed = (character, consumed) => new MessageEmbed({
        color: 'DARK_GREEN',
        title: '☠️🍴 Finally... food... but at what cost?',
        description: '> You look around to make sure no one is looking... before silently tearing into your fairly caught hunt, hastily hiding ' + (consumed.length === 1 ? 'all':'') + ' the pair' + (consumed.length !== 1 ? 's':'') + ' of bones of the '
        + this.formatConsumed(consumed)
        + ' before anyone could catch on. However, they are still visible to a trained eye.\n\n'
        + (
            Hunger.isSatiated(character)
            ? ('You are fully satiated.')
            : ('Just... `' + (Hunger.bitesToSatisfy(character))
            + '` more bite' + (Hunger.bitesToSatisfy(character) !== 1 ? 's' : '')  + '...')
        ),
        footer: { text: CANON_MESSAGE },
    });

    /**
     * Generate a post-eat summary for the user who ate "Honestly"
     * @param {CharacterModel} character 
     * @param {prey[]} consumed 
     */
    static generateHonestResultEmbed = (character, consumed) => new MessageEmbed({
        color: 'GREEN',
        title: '🍴 __Finally, food.__',
        description: `> ${consumed.length == 1 ? 'Y':'One after the other, y'}ou take ${this.formatConsumed(consumed)} between your teeth and tear into ${consumed.length == 1 ? 'it' : 'them'}, finally getting a good meal.`
        + '\n> \n> ' + (
            Hunger.isSatiated(character)
            ? ('You are fully satiated.')
            : ('Just... `' + (Hunger.bitesToSatisfy(character))
            + '` more bite' + (Hunger.bitesToSatisfy(character) !== 1 ? 's' : '') + '...')
        ),
        footer: { text: CANON_MESSAGE }
    });

    static generatePreyEatenClanAlertEmbed = (character, member, clan, bitesTaken, consumed) => {
        // food was eaten by a clan member
        if (character.clan == clan) return this.generateEatenFoodAlertEmbed(character, member, bitesTaken, consumed);

        // food was possibly stolen
        return this.generateStolenFoodAlertEmbed(character, member, bitesTaken, consumed);
    }

    static generateStolenFoodAlertEmbed = (character, member, bitesTaken, consumed) => new MessageEmbed({
        color: 'RED',
        image: { url: 'https://www.wildliferemoval.com/wp-content/uploads/2019/02/Animal-Tracks.jpg' },
        title: '❗⚠️ Some prey has possibly been stolen!',
        description: `\
        **An outsider to our clan has eaten from our prey pile!!**\
        \n> The scent is coming from someone from **${character.clan?.toUpperCase() || 'unknown clan or territory'}**.\
        \n\
        \n**SPOILER** \| WHO IT WAS: || ${(character.name ?? '') + ' (' + member.user.tag + '\'s character' + '(' + member.user.id + '))'} ||
        \n\
        \n*(if someone has recently been given food, this can be ignored)*\
        \n**- - - - - -**\
        \n\
        \n**They have eaten \`${bitesTaken}\` bite${bitesTaken != 1 ? 's' : ''} of food, and have consumed the following**:\
        \n\
        \n${this.formatConsumed(consumed)}\
        \n\
        \n**- - - - - -**`,
        footer: { text: CANON_MESSAGE },
    });

    static generateEatenFoodAlertEmbed = (character, member, bitesTaken, consumed) => new MessageEmbed({
        color: 'AQUA',
        author: {
            name: '🦴 Some prey has been eaten',
            iconURL: character.icon ?? member.displayAvatarURL({ dynamic: true })
        },
        thumbnail: { url: 'https://c.tenor.com/27kedvI8EwQAAAAd/cat-eating.gif' },
        description: `\
        **${character.name ?? member.displayName + '\'s character'}** has eaten some food from the prey pile.\
        \n\
        \n**- - - - - -**\
        \n\
        \n**They have eaten \`${bitesTaken}\` bite${bitesTaken != 1 ? 's' : ''} of food, and have consumed the following**:\
        \n\
        \n${this.formatConsumed(consumed)}\
        \n\
        \n**- - - - - -**`,
        footer: { text: CANON_MESSAGE },
    });

}

module.exports = Eating;