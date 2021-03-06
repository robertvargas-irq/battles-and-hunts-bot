const { ApplicationCommandOptionType : CommandTypes } = require('discord-api-types/v10');
const { CommandInteraction, GuildMember, EmbedBuilder, Colors } = require('discord.js');
const CoreUtil = require('../../util/CoreUtil');
const getRandom = (min, max) => { return Math.floor(Math.random() * (max + 1 - min) + min) }

module.exports = {
    name: 'who-first',
    description: 'Flip a coin to see who goes first in battle!',
    options: [
        {
            name: 'opponent',
            description: 'Your opponent.',
            type: CommandTypes.User,
            required: true,
        },
    ],
    /**
     * @param {CommandInteraction} interaction 
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

        // build embed
        const callerCharacter = CoreUtil.Characters.cache.get(interaction.guild.id, interaction.user.id);
        const targetCharacter = CoreUtil.Characters.cache.get(interaction.guild.id, target.user.id);
        interaction.editReply({
            embeds: [new EmbedBuilder()
                .setColor(first ? Colors.Green : Colors.Yellow)
                .setTitle('💭 __Let\'s see who\'s first!__')
                .setThumbnail(
                    first
                    ? callerCharacter.icon ?? interaction.member.displayAvatarURL({ dynamic: true })
                    : targetCharacter.icon ?? target.displayAvatarURL({ dynamic: true })
                )
                .setDescription(
                `> Time to flip a coin...\n\n` +
                `🌿 (\`HEADS\`) **${callerCharacter.name ?? interaction.member.displayName + '\'s character'}**\n` +
                `🆚 (\`TAILS\`) **${targetCharacter.name ?? target.displayName + '\'s character'}**\n\n` +
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
 * @param {CommandInteraction} interaction 
 */
function denyBotAttack(interaction) {
    interaction.editReply({
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
 function denySelfAttack(interaction) {
    interaction.editReply({
        embeds : [new EmbedBuilder()
            .setColor(Colors.Blurple)
            .setTitle('❤️‍🩹 Hey now')
            .setDescription('You can\'t attack yourself! Take care! 🌟')
        ]
    });
    return false;
}