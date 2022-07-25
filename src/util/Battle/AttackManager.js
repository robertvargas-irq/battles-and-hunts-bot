const { EmbedBuilder, CommandInteraction, GuildMember, Colors } = require('discord.js');
const CharacterModel = require('../../database/schemas/character');
const CoreUtil = require('../CoreUtil');
const StatCalculator = require('../Stats/StatCalculator');
const PronounsUtil = require('../WritingUtil/PronounsUtil');
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
        embeds.push(EmbedBuilder.from({
            color: (hit && crit) ? 0xfa7acb : (hit) ? 0xabfa7a : 0xfa877a,
            image: { url: attacker.icon ?? interaction.member.displayAvatarURL({ dynamic: true }) },
            author: {
                name: '🗡️ '
                + (attacker.name ?? interaction.member.displayName + '\'s character')
                + ' has launched an attack!'
            },
        }));

        // break down attack roll
        embeds.push(EmbedBuilder.from({ 
            color: (hit && crit) ? 0xfa7acb : (hit) ? 0x7afabc : 0xfaad7a,
            author: {
                name: hit
                ? '🎯 ' + CoreUtil.ProperCapitalization(attacker.pronouns.subjective ?? 'They') + ' '
                + PronounsUtil.neutralResolver(attacker.pronouns.subjective ?? 'They', 'manage', 'manages') + ' to catch an opening-!'
                : '🍃 ' + PronounsUtil.pluralToSingular(
                    CoreUtil.ProperCapitalization(attacker.pronouns.possessive ?? 'Their')
                ) + ' enemy, however, slipped away'
            },
            description: '> **Enemy Dodge Chance**: `' + StatCalculator.calculateDodgeChance(target) + '`'
            + '\n> **Rolled**: `' + d1Hit + '`/`100`'
        }));

        // if the user hit, then display crit results
        if (hit) embeds.push(EmbedBuilder.from({
            color: (hit && crit) ? 0xfa7acb : (crit) ? 0x7afabc : 0xfaad7a,
            author: {
                name: crit
                ? '🪨 ' + CoreUtil.ProperCapitalization(attacker.pronouns.subjective ?? 'They') + ' '
                + PronounsUtil.neutralResolver(attacker.pronouns.subjective ?? 'They', 'wind', 'winds') + ' up for a critical blow-!'
                : '🍃 ' + CoreUtil.ProperCapitalization(attacker.pronouns.subjective ?? 'They') + ' '
                + PronounsUtil.neutralResolver(attacker.pronouns.subjective ?? 'They', 'opt', 'opted') + ' for a normal attack'
            },
            description: '> **Attacker\'s Critical Threshold**: `' + StatCalculator.min.critChance + '`-`' + StatCalculator.calculateCritChance(attacker) + '`'
            + '\n> **Rolled**: `' + d2Crit + '`/`100`'
        }));

        // provide a brief summary
        embeds.push(EmbedBuilder.from({
            color: hit ? 0xfa877a : 0xabfa7a,
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
            embeds : [new EmbedBuilder()
                .setColor(Colors.Blurple)
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
            embeds : [new EmbedBuilder()
                .setColor(Colors.Blurple)
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
            embeds : [new EmbedBuilder()
                .setColor(Colors.Blurple)
                .setTitle('🛡️ WOAH THERE')
                .setDescription('You can\'t attack a cat that doesn\'t exist yet!\nLet them know to create and submit their character for review!\n\nThey can get started with `/character`!')
            ]
        });
        return false;
    }
}

module.exports = AttackManager;