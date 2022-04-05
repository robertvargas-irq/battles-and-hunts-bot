const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, GuildMember, MessageEmbed } = require('discord.js');

const getRandom = (min, max) => { return Math.floor(Math.random() * (max + 1 - min) + min) }
const MAX_ROLL = 1000;

module.exports = {
    name: 'who-goes-first',
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
        const target = interaction.options.getMember('opponent');
        if (target.user.bot) return denyBotAttack(interaction);
        if (target.user.id === interaction.user.id) return denySelfAttack(interaction);
        
        // // roll and inform
        // let roll = getRandom(1, MAX_ROLL);
        // let pivot = Math.floor(MAX_ROLL / 2);
        // let first = roll < pivot;

        // flip a coin
        const coin = getRandom(0, 1);
        const first = coin == 0;
        const side = first ? 'HEADS' : 'TAILS'

        interaction.editReply({
            embeds: [new MessageEmbed()
                .setColor(first ? 'GREEN' : 'YELLOW')
                .setTitle('🪙 __Let\'s see who\'s first!__')
                .setThumbnail(first ? interaction.member.displayAvatarURL() : target.displayAvatarURL())
                .setDescription(
                `Time to flip a coin...\n` +
                `🌿 (\`HEADS\`) **${interaction.member.displayName}**\n` +
                `🆚 (\`TAILS\`) **${target.displayName}**\n\n` +
                `🪙 The coin has landed on **\`${side}\`**\n` +
                `> **<@${first ? interaction.user.id : target.user.id}> goes first!!**`
                )
            ]
        })

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
    
    const response = new MessageEmbed({
        color: (hit && crit) ? 'YELLOW' : (hit) ? 'GREEN' : 'RED',
        title: '🎲 __**Attack Roll Results**__ 🎲',
        description: descriptionFormat,
    }).setFooter('Target: ' + targetSnowflake.displayName, targetSnowflake.displayAvatarURL());

    await interaction.editReply({ embeds: [response] });
}