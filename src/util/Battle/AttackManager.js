const { MessageEmbed, BaseCommandInteraction } = require('discord.js');
const CoreUtil = require('../CoreUtil');
const {p_hit_and_crit, p_hit, p_crit_but_miss, p_miss} = require('./attackPrompts.json');
const {damageAction, damageResponse} = require('./damagePrompts.json');
const {healingAction, healingResponse} = require('./medicinePrompts.json');


/**@typedef {'unforgiven'|'riverclan'|'shadowclan'|'thunderclan'} clans */
/**@typedef {{name: string, size: number, bites_remaining: number}} prey */

/**
 * Initiate rolls.
 * @param {BaseCommandInteraction} interaction 
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
        
        console.log({rolls});
        console.error({rolls});
        return Math.floor(
            rolls[
                Math.floor( Math.random() * ROLL_COUNT )
            ]  * (max - min + 1) + min
        );


    };

    static async rollAndGiveAttackResult(interaction, attacker, target, targetMember) {

        // calculate rolls
        const d1Hit = this.#Random(1, 100);
        const d2Crit = this.#Random(1, 100);
        
        // check DCs
        const hit = d1Hit > target.stats.speed * 4; // successful dodge DC
        const crit = d2Crit <= attacker.stats.dexterity * 3; // successful crit DC
        const damage = attacker.stats.strength * 4 * (crit ? 2 : 1); // attack damage

        // populate embeds relative to rolls
        const embeds = [];

        // create attack header with attacker
        embeds.push(new MessageEmbed({
            color: (hit && crit) ? '#fa7acb' : (hit) ? '#abfa7a' : '#fa877a',
            image: { url: interaction.member.displayAvatarURL() },
            // thumbnail: { url: interaction.member.displayAvatarURL() },
            title: '🗡️ ' + interaction.member.displayName + ' has launched an attack!',
        }));

        // break down attack roll
        embeds.push(new MessageEmbed({ 
            color: (hit && crit) ? '#fa7acb' : (hit) ? '#7afabc' : '#faad7a',
            title: hit ? '🎯 They manage to catch an opening-!' : '🍃 Their enemy, however, slipped away',
            description: '> **Enemy Dodge Chance**: `' + target.stats.speed * 4 + '`'
            + '\n> **Rolled**: `' + d1Hit + '`/`100`'
        }));

        // if the user hit, then display crit results
        if (hit) embeds.push(new MessageEmbed({
            color: (hit && crit) ? '#fa7acb' : (crit) ? '#7afabc' : '#faad7a',
            title: crit ? '🪨 They wind up for a critical blow-!' : '🍃 They opt for a normal attack',
            description: '> **Attacker\'s Critical Threshold**: `0`-`' + attacker.stats.dexterity * 3 + '`'
            + '\n> **Rolled**: `' + d2Crit + '`/`100`'
        }));

        // provide a brief summary
        embeds.push(new MessageEmbed({
            color: hit ? '#fa877a' : '#abfa7a',
            thumbnail: { url: targetMember.displayAvatarURL() },
            title: (hit && crit ? '💥 CRITICAL HIT\n' : hit ? '⚔️ ' : '🍃 ')
            + targetMember.displayName + ' ' + (hit ? 'has endured `' + damage + '` damage!' : 'has avoided the blow'),
            description: '> **' + interaction.member.displayName + '** ' + getRandomDescription(hit, crit)
            + (hit ? '\n\n**' + targetMember.displayName + ' must now use `/take-damage` `' + damage + '`.' + '**' : ''),
        }));

        // display roll breakdowns and summary to the user
        return await interaction.editReply({ embeds });

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
     * @param {BaseCommandInteraction} interaction 
     */
    static denyBotAttack(interaction) {
        interaction.editReply({
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
     * @param {BaseCommandInteraction} interaction 
     */
    static denySelfAttack(interaction) {
        interaction.editReply({
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
     * @param {BaseCommandInteraction} interaction 
     */
    static targetNotRegistered(interaction) {
        interaction.editReply({
            embeds : [new MessageEmbed()
                .setColor('BLURPLE')
                .setTitle('🛡️ WOAH THERE')
                .setDescription('You can\'t attack a cat that doesn\'t exist!\nLet them know to sign up by trying to ')
            ]
        });
        return false;
    }

    static getRandomDamageMessage(health) {
        if (health < 1) return 'Silence, as the world fades to black.';
        return damageAction[Math.floor(Math.random() * damageAction.length)] + ', ' +
            damageResponse[Math.floor(Math.random() * damageResponse.length)] + '.';
    }

    static getRandomHealingMessage() {
        return healingAction[Math.floor(Math.random() * healingAction.length)] + ', ' +
            healingResponse[Math.floor(Math.random() * healingResponse.length)] + '.';
    }
}

module.exports = AttackManager;