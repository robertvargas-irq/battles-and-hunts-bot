const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, GuildMember, MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const userSchema = require('../database/schemas/user');
const firstTimeRegister = require('../util/Account/firstTimeRegister');

const getRandom = (min, max) => { return Math.floor(Math.random() * (max + 1 - min) + min) }


module.exports = {
    name: 'attack',
    description: 'Attack another user!',
    guilds: ['957854680367648778', '954037682223316992'],
    options: [
        {
            name: 'opponent',
            description: 'The target of this attack.',
            type: dTypes.User,
            required: true,
        },
    ],
    /**
     * 
     * @param {BaseCommandInteraction} interaction 
     * @returns 
     */
    async execute(interaction) {

        // defer
        await interaction.deferReply({ ephemeral: false });

        // if target is bot or user, deny
        /**@type {GuildMember}*/
        const targetSnowflake = interaction.options.getMember('opponent');
        if (targetSnowflake.user.bot) return denyBotAttack(interaction);
        if (targetSnowflake.user.id === interaction.user.id) return denySelfAttack(interaction);
        
        // pull user from the database
        const User = mongoose.model('User', userSchema);
        /**@type {mongoose.Document}*/ let attacker = await User.findOne({ userId: interaction.user.id }).exec();

        // prompt registration if user is not registered; then continue on
        if (!attacker) attacker = await firstTimeRegister(interaction);
        if (!attacker) return; // error message already handled in collect()

        // if target is not registered, deny
        /**@type {mongoose.Document}*/ let target = await User.findOne({ userId: targetSnowflake.user.id }).exec();
        if (!target) return targetNotRegistered(interaction);

        // initiate rolls
        return battle(interaction, attacker, target, targetSnowflake);
    },
};

// if (the_hny) she_win();

/**
 * Inform the user they cannot attack bots.
 * @param {BaseCommandInteraction} interaction 
 */
function denyBotAttack(interaction) {
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
 function denySelfAttack(interaction) {
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
function targetNotRegistered(interaction) {
    interaction.editReply({
        embeds : [new MessageEmbed()
            .setColor('BLURPLE')
            .setTitle('🛡️ WOAH THERE')
            .setDescription('You can\'t attack a cat that doesn\'t exist!\nLet them know to sign up by trying to ')
        ]
    });
    return false;
}

/**
 * Initiate rolls.
 * @param {BaseCommandInteraction} interaction 
 * @param {userSchema} attacker 
 * @param {userSchema} target 
 * @param {GuildMember} targetSnowflake
 */
async function battle(interaction, attacker, target, targetSnowflake) {

    // calculate rolls
    const d1Hit = getRandom(1, 100);
    const d2Crit = getRandom(1, 100);
    
    // check DCs
    const hit = d1Hit > target.stats.speed * 4; // successful dodge DC
    const crit = d2Crit <= attacker.stats.dexterity * 3; // successful crit DC
    const damage = attacker.stats.strength * 4 * (crit ? 2 : 1); // attack damage

    // inform user
    const descriptionFormat = `
    Roll Breakdowns:
    **- - - - - -**
    __(1d100) Attack Hit__: ${hit ? '✅' : '⛔'}
    > **Rolled**: \`${d1Hit}\` / \`100\`
    > **Enemy Dodge Chance**: \`${target.stats.speed * 4}\`
    > \`${d1Hit}\` ${hit ? '>' : '≤'} \`${target.stats.speed * 4}\`

    \n__(1d100) Critical Hit__: ${crit ? '✅' : '⛔'}
    > **Rolled**: \`${d2Crit}\` / \`100\`
    > **Your Crit. Range**: \`0\` - \`${attacker.stats.dexterity * 3}\`
    > \`${d2Crit}\` ${crit ? '≤' : '>'} \`${attacker.stats.dexterity * 3}\`

    **- - - - - -**

    > ⚔️ **${getRandomDescription(hit, miss)}**

    **- - - - - -**
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
    }).setFooter('Target: ' + targetSnowflake.displayName, targetSnowflake.displayAvatarURL());

    await interaction.editReply({ embeds: [response] });
}

// CRIT: YELLOW
// HIT: GREEN
// MISS: RED
// CRIT AND MISS:  RED
hit_crit = [
    'You land a thunderous blow!',
    'You savaged the enemy!'
];
hit = [
    'You managed to land a blow!',
    'You land a strike!'
];
crit_miss = [
    'You are able to crit! But what a waste as you miss such a devastating attack!',
    'With such thunderous swipe; you unfortunately miss.',
    'With all of your might, you swipe at the enemy, and go wide; you miss!'
];
miss = [
    'You have missed!',
    'You have stumbled!',
    'You trip over your paws!',
    'You weren\'t paying attention! What a miss!'
];
getRandomQuote = (quotes) => quotes[Math.floor(Math.random() * quotes.length)]
function getRandomDescription(hit, crit) {
    if (hit && crit)
        return getRandomQuote(hit_crit);
    if (hit)
        return getRandomQuote(hit);
    if (crit)
        return getRandomQuote(crit_miss);
    
    // miss if no conditions met
    return getRandomQuote(miss);
}