const { MessageEmbed, CommandInteraction, GuildMember } = require('discord.js');
const CharacterModel = require('../../database/schemas/character');
const CoreUtil = require('../CoreUtil');
const StatCalculator = require('../Stats/StatCalculator');
const {p_hit_and_crit, p_hit, p_crit_but_miss, p_miss} = require('./attackPrompts.json');

/**@typedef {'unforgiven'|'riverclan'|'shadowclan'|'thunderclan'} clans */
/**@typedef {{name: string, size: number, bites_remaining: number}} prey */

/**
 * Initiate rolls.
 * @param {CommandInteraction} interaction 
 * @param {userSchema} attacker 
 * @param {userSchema} target 
 * @param {GuildMember} targetSnowflake
 */
class AttackManager extends CoreUtil {
    static MAX_WEIGHT = 3;
    static INVENTORY_MAX_WEIGHT = 7;
    static #Random = (min, max) => {
        const ROLL_COUNT = 13;
        let rolls = [];
        for (let i = 0; i < ROLL_COUNT; i++) {
            rolls.push(Math.random());
        }

        return Math.floor(
            rolls[
                Math.floor( Math.random() * ROLL_COUNT )
            ]  * (max - min + 1) + min
        );


    };

    /**
     * Roll and display the attack result
     * @param {CommandInteraction} interaction 
     * @param {CharacterModel} attacker 
     * @param {CharacterModel} target 
     * @param {GuildMember} targetMember 
     */
    static async rollAndGiveAttackResult(interaction, attacker, target, targetMember) {

        // calculate rolls
        const d1Hit = this.#Random(1, 100);
        const d2Crit = this.#Random(1, 100);
        
        // check DCs
        const hit = d1Hit > StatCalculator.calculateDodgeChance(target); // successful dodge DC
        const crit = d2Crit <= StatCalculator.calculateCritChance(attacker); // successful crit DC
        const damage = StatCalculator.calculateAttackMax(attacker) * (crit ? 2 : 1); // attack damage

        // populate embeds relative to rolls
        const embeds = [];

        // create attack header with attacker
        embeds.push(new MessageEmbed({
            color: (hit && crit) ? '#fa7acb' : (hit) ? '#abfa7a' : '#fa877a',
            image: { url: attacker.icon ?? interaction.member.displayAvatarURL({ dynamic: true }) },
            author: {
                name: '🗡️ '
                + (attacker.name ?? interaction.member.displayName + '\'s character')
                + ' has launched an attack!'
            },
        }));

        // break down attack roll
        embeds.push(new MessageEmbed({ 
            color: (hit && crit) ? '#fa7acb' : (hit) ? '#7afabc' : '#faad7a',
            author: { name: hit ? '🎯 They manage to catch an opening-!' : '🍃 Their enemy, however, slipped away' },
            description: '> **Enemy Dodge Chance**: `' + StatCalculator.calculateDodgeChance(target) + '`'
            + '\n> **Rolled**: `' + d1Hit + '`/`100`'
        }));

        // if the user hit, then display crit results
        if (hit) embeds.push(new MessageEmbed({
            color: (hit && crit) ? '#fa7acb' : (crit) ? '#7afabc' : '#faad7a',
            author: { name: crit ? '🪨 They wind up for a critical blow-!' : '🍃 They opt for a normal attack' },
            description: '> **Attacker\'s Critical Threshold**: `' + StatCalculator.min.critChance + '`-`' + StatCalculator.calculateCritChance(attacker) + '`'
            + '\n> **Rolled**: `' + d2Crit + '`/`100`'
        }));

        // provide a brief summary
        embeds.push(new MessageEmbed({
            color: hit ? '#fa877a' : '#abfa7a',
            thumbnail: { url: target.icon ?? targetMember.displayAvatarURL({ dynamic: true }) },
            title: (hit && crit ? '💥 CRITICAL HIT\n' : hit ? '⚔️ ' : '🍃 ')
            + (target.name ?? targetMember.displayName + '\'s character')
            + ' ' + (hit ? 'has endured `' + damage + '` damage!' : 'has avoided the blow'),
            description: '> **' + (attacker.name ?? interaction.member.displayName + '\'s character') + '** ' + getRandomDescription(hit, crit)
            + (hit ? '\n\n**' + targetMember.displayName + ' must now use `/take-damage` `' + damage + '`.' + '**' : ''),
        }));

        // display roll breakdowns and summary to the user
        return await this.SafeReply(interaction, { embeds });

        // random quote handler
        function getRandomQuote(quotes) { return quotes[Math.floor(Math.random() * quotes.length)]; }
        function getRandomDescription(hit, crit) {
            if (hit && crit)
                return getRandomQuote(p_hit_and_crit);
            if (hit)
                return getRandomQuote(p_hit);
            if (crit)
                return getRandomQuote(p_crit_but_miss);
            
            // miss if no conditions met
            return getRandomQuote(p_miss);
        }

    }

    /**
     * Inform the user they cannot attack bots.
     * @param {CommandInteraction} interaction 
     */
    static denyBotAttack(interaction) {
        this.SafeReply(interaction, {
            embeds : [new MessageEmbed()
                .setColor('BLURPLE')
                .setTitle('🛡️ WOAH THERE')
                .setDescription('You can\'t attack a bot! 🤖')
            ]
        });
        return false;
    }

    /**
     * Inform the user they cannot attack themselves.
     * @param {CommandInteraction} interaction 
     */
    static denySelfAttack(interaction) {
        this.SafeReply(interaction, {
            embeds : [new MessageEmbed()
                .setColor('BLURPLE')
                .setTitle('❤️‍🩹 Hey now')
                .setDescription('You can\'t attack yourself! Take care! 🌟')
            ]
        });
        return false;
    }

    /**
     * Inform the user that their target is not registered.
     * @param {CommandInteraction} interaction 
     */
    static targetNotRegistered(interaction) {
        this.SafeReply(interaction, {
            embeds : [new MessageEmbed()
                .setColor('BLURPLE')
                .setTitle('🛡️ WOAH THERE')
                .setDescription('You can\'t attack a cat that doesn\'t exist yet!\nLet them know to create and submit their character for review!\n\nThey can get started with `/character`!')
            ]
        });
        return false;
    }
}

module.exports = AttackManager;