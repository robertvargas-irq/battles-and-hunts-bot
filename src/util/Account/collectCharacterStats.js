const FILE_LANG_ID = 'COLLECT_CHARACTER_STATS';

const { Message, MessageEmbed, BaseCommandInteraction } = require('discord.js');
const Translator = require('../Translator');
const RETRIES = 3;
const TIME = 90;
const clans = ['unforgiven', 'shadowclan', 'thunderclan', 'riverclan'];

const {names, tooltips, ranges, flairs, name_translations} = require('./stats.json');

/**
 * Prompts user for character stats.
 * @param {BaseCommandInteraction} interaction 
 * @param {String} userId 
 */
async function collectCharacterStats(interaction, promptMessage) {

    // create translator
    const translator = new Translator(interaction.user.id, FILE_LANG_ID);

    // find clan in their roles
    let clanRole;
    interaction.member.roles.cache.find(r => {
        let name = r.name.toLowerCase().replace(/[^a-zA-Z]/g, '');
        if (clans.some(c => c == name)) {
            clanRole = name;
            return true;
        }
        return false;
    });
    if (!clanRole) return notRegistered(interaction, translator);

    // prompt for stats
    const prompt = new MessageEmbed({
        color: 'AQUA',
        title: "🐈‍ " + translator.get('STAT_DECLARATION'),
        description: promptMessage,
        footer: { text: '❕ ' + translator.getGlobal('SEND_TO_CANCEL') }
    });
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
    for await (let _ of names) {

        // current min and max for the field in question
        let c_MIN = ranges[field][0];
        let c_MAX = ranges[field][1];

        // prompt for new input
        await interaction.editReply({
            embeds: [prompt.addField(
                `${translator.getFromObject(name_translations[field])} ${flairs[field]}`, 
                `⁅⁘⟧ [\`${c_MIN}\` - \`${c_MAX}\`] `
                +`${translator.get('PLEASE_SEND')} \`${translator.getFromObject(name_translations[field]).toUpperCase()}\` ${translator.get('PLEASE_SEND_FOLLOWUP')}`
                + `\n>>> ${translator.getFromObject(tooltips[field])}`
            )]
        });

        // get user input and validate
        let input = await collect(interaction, filter);

        // if input is not valid, retry 3 times
        if (!input) return terminate(interaction, translator);
        let validInput = validate(input);
        let parsed = parseInt(input.split(/[^0-9]/)[0]);

        // validate input: loop until retries are over or correct input is given
        for (let i = 0; i < RETRIES
        && (!validInput || (parsed < c_MIN || parsed > c_MAX)); i++) {
            // process quit command
            if (input.toLowerCase() === 'cancel') return cancel(interaction, translator);

            // prompt for new input since invalid
            prompt.fields[field].value = `⚠️ \`${input}\` ${translator.get('INVALID_INPUT_1')} [\`${c_MIN}\` - \`${c_MAX}\`].\n(${RETRIES - i} ${translator.get('INVALID_INPUT_2')}.)`;
            await interaction.editReply({ embeds: [prompt] });
            input = await collect(interaction, filter);

            // validate
            if (!input) return terminate(interaction, translator);
            validInput = !/[^0-9]/.exec(input);
            parsed = parseInt(input.split(/[^0-9]/)[0]);
        }

        // final input validation
        if (!validInput) return invalid(interaction, translator);
        parsed = parseInt(input.split(/[^0-9]/)[0]);
        if (parsed < 0 || parsed > 10) return invalid(interaction, translator);

        // after input is successful, update field
        stats[names[field].toLowerCase().replace(' ', '_')] = parsed;
        prompt.fields[field].value = `> ↣ \`${input.toString()}\` / \`${c_MAX}\``;
        field++;
        
    }
    await interaction.editReply({ embeds: [prompt] });

    // return full stats
    return { clanRole, stats };

}

/**
 * Prompts that time has run out.
 * @param {BaseCommandInteraction} interaction 
 * @param {Translator} translator
 */
function terminate(interaction, translator) {
    interaction.editReply({
        embeds: [ new MessageEmbed()
            .setColor('AQUA')
            .setTitle("⏰ " + translator.getGlobal('TIMEOUT'))
            .setDescription(translator.getGlobal('TIMEOUT_MESSAGE') + " ❣️"),
        ]
    });
    return false;
}

/**
 * Inform that input is invalid.
 * @param {BaseCommandInteraction} interaction 
 * @param {Translator} translator
 */
function invalid(interaction, translator) {
    interaction.editReply({
        embeds: [ new MessageEmbed()
            .setColor('AQUA')
            .setTitle("⚠️ " + translator.get('TOO_MANY_INVALID'))
            .setDescription(translator.get('TOO_MANY_INVALID_MESSAGE') + " ❣️"),
        ]
    });
    return false;
}

/**
 * Inform that they have not been assigned a clan yet.
 * @param {BaseCommandInteraction} interaction 
 * @param {Translator} translator
 */
function notRegistered(interaction, translator) {
    interaction.editReply({
        embeds: [ new MessageEmbed()
            .setColor('RED')
            .setTitle("⚠️ " + translator.get('NOT_REGISTERED'))
            .setDescription(translator.get('NOT_REGISTERED_MESSAGE') + " ❣️"),
        ]
    });
    return false;
}

/**
 * Show successful cancellation.
 * @param {BaseCommandInteraction} interaction 
 * @param {Translator} translator
 */
 function cancel(interaction, translator) {
    interaction.editReply({
        embeds: [ new MessageEmbed()
            .setColor('AQUA')
            .setTitle("✅ " + translator.getGlobal('SUCCESSFUL_CANCEL'))
            .setDescription(translator.getGlobal('MENU_DISMISS') + " ❣️"),
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