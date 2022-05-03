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
    // static #Random = (min, max) => { return Math.floor(Math.random() * (max - min + 1) + min) };
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
    static #RandomFromArray = (a) => { return a[this.#Random(0, a.length - 1)] }

    static async rollAndGiveAttackResult(interaction, attacker, target, targetSnowflake) {

        // calculate rolls
        const d1Hit = this.#Random(1, 100);
        const d2Crit = this.#Random(1, 100);
        
        // check DCs
        const hit = d1Hit > target.stats.speed * 4; // successful dodge DC
        const crit = d2Crit <= attacker.stats.dexterity * 3; // successful crit DC
        const damage = attacker.stats.strength * 4 * (crit ? 2 : 1); // attack damage

        // inform user
        const descriptionFormat = `
        Roll Breakdowns:\n**- - - - - -**
        __(1d100) Attack Hit__: ${hit ? '✅' : '⛔'}
        > **Rolled**: \`${d1Hit}\` / \`100\`
        > **Enemy Dodge Chance**: \`${target.stats.speed * 4}\`
        > \`${d1Hit}\` ${hit ? '>' : '≤'} \`${target.stats.speed * 4}\`
        
        __(1d100) Critical Hit__: ${crit ? '✅' : '⛔'}
        > **Rolled**: \`${d2Crit}\` / \`100\`
        > **Your Crit. Range**: \`0\` - \`${attacker.stats.dexterity * 3}\`
        > \`${d2Crit}\` ${crit ? '≤' : '>'} \`${attacker.stats.dexterity * 3}\`\n\n**- - - - - -**

        > ⚔️ **${this.#getRandomDescription(hit, crit)}**\n\n**- - - - - -**
        ` + ( hit ?
        `
        > **<@${targetSnowflake.user.id}> has endured \`${damage}\`${crit ? ' CRITICAL ' : ' '}damage!!**
        > 
        > ⚠️ **They must use the \`/take-damage\` command with amount \`${damage}\`!!**
        > ➡️ \`/take-damage amount: ${damage}\`
        ` : '');
        const response = new MessageEmbed({
            color: (hit && crit) ? 'YELLOW' : (hit) ? 'GREEN' : 'RED',
            title: '🎲 __**Attack Roll Results**__ 🎲',
            description: descriptionFormat,
            thumbnail: {url: interaction.member.displayAvatarURL()},
            footer: {text: 'Target: ' + targetSnowflake.displayName, icon_url: targetSnowflake.displayAvatarURL()}
        });

        await interaction.editReply({ embeds: [response] });
    }

    static #getRandomQuote = (quotes) => quotes[Math.floor(Math.random() * quotes.length)]
    static #getRandomDescription(hit, crit) {
        if (hit && crit)
            return this.#getRandomQuote(p_hit_and_crit);
        if (hit)
            return this.#getRandomQuote(p_hit);
        if (crit)
            return this.#getRandomQuote(p_crit_but_miss);
        
        // miss if no conditions met
        return this.#getRandomQuote(p_miss);
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