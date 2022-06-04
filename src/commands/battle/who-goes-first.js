const { ApplicationCommandOptionType : CommandTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, GuildMember, MessageEmbed } = require('discord.js');
const getRandom = (min, max) => { return Math.floor(Math.random() * (max + 1 - min) + min) }

module.exports = {
    name: 'who-first',
    description: 'Flip a coin to see who goes first in battle!',
    options: [
        {
            name: 'opponent',
            description: 'The target of this attack.',
            type: CommandTypes.User,
            required: true,
        },
    ],
    /**
     * @param {BaseCommandInteraction} interaction 
     */
    async execute(interaction) {

        // defer
        await interaction.deferReply({ ephemeral: false });

        // if target is bot or user, deny
        /**@type {GuildMember}*/
        const target = interaction.options.getMember('opponent');
        if (target.user.bot) return denyBotAttack(interaction);
        if (target.user.id === interaction.user.id) return denySelfAttack(interaction);
        
        // flip a coin
        const coin = getRandom(0, 1);
        const first = coin == 0;
        const side = first ? 'HEADS' : 'TAILS'

        interaction.editReply({
            embeds: [new MessageEmbed()
                .setColor(first ? 'GREEN' : 'YELLOW')
                .setTitle('💭 __Let\'s see who\'s first!__')
                .setThumbnail(first ? interaction.member.displayAvatarURL() : target.displayAvatarURL())
                .setDescription(
                `> Time to flip a coin...\n\n` +
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