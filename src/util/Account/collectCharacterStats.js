const editCharacter = require('./editCharacter');
const { Message, MessageEmbed, BaseCommandInteraction } = require('discord.js');
const MIN = 0;
const MAX = 10;
const RETRIES = 3;
const TIME = 30;

/**
 * Prompts user for character stats.
 * @param {BaseCommandInteraction} interaction 
 * @param {String} userId 
 */
async function collectCharacterStats(interaction) {

    // prompt for stats
    const prompt = new MessageEmbed({ title: "🐈‍ Stat Declaration", color: 'AQUA' });
    const filter = (/**@type {Message}*/ message) => message.author.id === interaction.user.id;
    let field = 0;
    let stats = {
        constitution: 0,
        strength: 0,
        speed: 0,
        dexterity: 0,
    };

    for await (let step of steps) {
        console.log(steps)
        console.log(step)

        // prompt for new input
        await interaction.editReply({
            embeds: [ prompt.addField(`${step} ${flair[field]}`, `¦⁘⟧ [\`${MIN}\` - \`${MAX}\`] Please send your character's \`${step.toUpperCase()}\``) ]
        });

        // get user input and validate
        let input = await collect(interaction, filter);
        console.log(input);

        // if input is not valid, retry 3 times
        if (!input) return terminate(interaction);
        let validInput = !/[^0-9]/.exec(input);
        let parsed = parseInt(input.split(/[^0-9]/)[0]);

        // validate
        for (let i = 0; i < RETRIES
        && (!validInput || (parsed < MIN || parsed > MAX)); i++) {
            // prompt for new input
            prompt.fields[field].value = `⚠️ \`${input}\` is **NOT** a valid input! Please only send a number between [\`${MIN}\` - \`${MAX}\`].\n(${RETRIES - i} attempts remaining.)`;
            await interaction.editReply({ embeds: [prompt] });
            input = await collect(interaction, filter);

            // validate
            if (!input) return terminate(interaction);
            validInput = !/[^0-9]/.exec(input);
            parsed = parseInt(input.split(/[^0-9]/)[0]);
        }

        // final input validation
        if (!validInput) return invalid(interaction);
        parsed = parseInt(input.split(/[^0-9]/)[0]);
        if (parsed < 0 || parsed > 10) return invalid(interaction);

        // after input is successful, update field
        stats[steps[field].toLowerCase()] = parsed;
        prompt.fields[field++].value = `> ↣ \`${input.toString()}\` / \`${MAX}\``;
        
        console.log(stats);
    }
    await interaction.editReply({ embeds: [prompt] });

    // return full stats
    return stats;

}

/**
 * Prompts that time has run out.
 * @param {BaseCommandInteraction} interaction 
 */
function terminate(interaction) {
    interaction.editReply({
        embeds: [ new MessageEmbed()
            .setColor('AQUA')
            .setTitle("⏰ This editor has timed out!")
            .setDescription("Please type faster ❣️"),
        ]
    });
    return false;
}

/**
 * Inform that input is invalid.
 * @param {BaseCommandInteraction} interaction 
 */
function invalid(interaction) {
    interaction.editReply({
        embeds: [ new MessageEmbed()
            .setColor('AQUA')
            .setTitle("⚠️ Too many invalid inputs.")
            .setDescription("Please send your previous command again ❣️"),
        ]
    });
    return false;
}

/**
 * Helper function; collects one input.
 * @param {BaseCommandInteraction} interaction
 */
async function collect(interaction, filter) {
    let input = await interaction.channel.awaitMessages({ filter: filter, max: 1, time: TIME * 1000, errors: ['time'] })
        .then(collected => { return collected.first().content })
        .catch(() => { return false });
    return input;
}

// stats to collect
const steps = [
    "Constitution",
    "Strength",
    "Speed",
    "Dexterity"
];
const flair = [
    "❤️‍🔥",
    "🦾",
    "💨",
    "⚔️"
];



module.exports = collectCharacterStats;