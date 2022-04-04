const { Message, MessageEmbed, BaseCommandInteraction } = require('discord.js');
const RETRIES = 3;
const TIME = 30;
const clans = ['unforgiven', 'shadowclan', 'thunderclan', 'riverclan'];

const {names, tooltips, ranges, flairs} = require('./stats.json');

/**
 * Prompts user for character stats.
 * @param {BaseCommandInteraction} interaction 
 * @param {String} userId 
 */
async function collectCharacterStats(interaction, promptMessage) {

    // find clan in their roles
    let clanRole;
    console.log(interaction.member.roles.cache);
    interaction.member.roles.cache.find(r => {
        let name = r.name.toLowerCase().replace(/[^a-zA-Z]/g, '');
        console.log(name);
        if (clans.some(c => c == name)) {
            clanRole = name;
            return true;
        }
        return false;
    });
    if (!clanRole) return notRegistered(interaction);

    // prompt for stats
    const prompt = new MessageEmbed({ title: "🐈‍ Stat Declaration", description: promptMessage, color: 'AQUA', footer: { text: '❕ Send cancel to quit.' } });
    const filter = (/**@type {Message}*/ message) => message.author.id === interaction.user.id;
    let field = 0;
    let stats = {
        cat_size: 0,
        strength: 0,
        dexterity: 0,
        constitution: 0,
        speed: 0,
        intelligence: 0,
        charisma: 0,
        swimming: 0,
        stalking: 0
    }

    // take input for each available step
    const validate = (input) => !/[^0-9]/.exec(input);
    for await (let step of names) {

        // current min and max for the field in question
        let c_MIN = ranges[field][0];
        let c_MAX = ranges[field][1];

        // prompt for new input
        await interaction.editReply({
            embeds: [ prompt.addField(`${step} ${flairs[field]}`, `⁅⁘⟧ [\`${c_MIN}\` - \`${c_MAX}\`] Please send your character's \`${step.toUpperCase()}\`\n>>> ${tooltips[field]}`) ]
        });

        // get user input and validate
        let input = await collect(interaction, filter);
        console.log(input);

        // if input is not valid, retry 3 times
        if (!input) return terminate(interaction);
        let validInput = validate(input);
        let parsed = parseInt(input.split(/[^0-9]/)[0]);

        // validate
        for (let i = 0; i < RETRIES
        && (!validInput || (parsed < c_MIN || parsed > c_MAX)); i++) {
            // process quit command
            if (input.toLowerCase() === 'cancel') return cancel(interaction);

            // prompt for new input
            prompt.fields[field].value = `⚠️ \`${input}\` is **NOT** a valid input! Please only send a number between [\`${c_MIN}\` - \`${c_MAX}\`].\n(${RETRIES - i} attempts remaining.)`;
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
        stats[names[field].toLowerCase().replace(' ', '_')] = parsed;
        prompt.fields[field].value = `> ↣ \`${input.toString()}\` / \`${c_MAX}\``;
        field++;
        
        console.log(stats);
    }
    await interaction.editReply({ embeds: [prompt] });

    // return full stats
    return { clanRole, stats };

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
 * Inform that they have not been assigned a clan yet.
 * @param {BaseCommandInteraction} interaction 
 */
function notRegistered(interaction) {
    interaction.editReply({
        embeds: [ new MessageEmbed()
            .setColor('RED')
            .setTitle("⚠️ You have not submitted a character yet.")
            .setDescription("You do not have a clan role yet. If this is a mistake, please let an administrator know ❣️"),
        ]
    });
    return false;
}

/**
 * Show successful cancellation.
 * @param {BaseCommandInteraction} interaction 
 */
 function cancel(interaction) {
    interaction.editReply({
        embeds: [ new MessageEmbed()
            .setColor('AQUA')
            .setTitle("✅ Successfully cancelled.")
            .setDescription("You may now dismiss this menu ❣️"),
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
        .then(collected => {
            let content = collected.first().content;
            collected.first().delete().catch(console.error);
            return content;
        })
        .catch(() => { return false });
    return input;
}

module.exports = collectCharacterStats;