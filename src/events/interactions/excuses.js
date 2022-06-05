const ExcuseHandler = require('../../util/Excused/ExcuseHandler');
const {
    ButtonInteraction,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    Modal,
    TextInputComponent
} = require('discord.js');

/**
 * GLOBAL buttons handler
 * @param {ButtonInteraction} button Passed button interaction
 */
module.exports = async (button) => {
    if (!button.customId.startsWith('EXCUSEBUTTON')) return;
    console.log(button.customId);
    console.log(button.customId.split(':'));

    const [BUTTON_TITLE, EXCUSE_DAY, EXCUSE_TYPE] = button.customId.split(':');
    console.log(BUTTON_TITLE);
    console.log(EXCUSE_DAY);
    console.log(EXCUSE_TYPE);

    // check to ensure the request day is not paused
    if (await ExcuseHandler.dayIsPaused(button.guild.id, EXCUSE_DAY)) return button.reply({
        ephemeral: true,
        embeds: [new MessageEmbed({
            color: 'YELLOW',
            title: '⚠️ Woah wait a minute-!',
            description: 'Looks like all excuse forms for **`' + EXCUSE_DAY + '`** are currently ⏸ **`PAUSED`**!'
            + '\n\nIf you believe this is a mistake, please contact an administrator!',
            timestamp: Date.now()
        })]
    });

    // if type received, generate modal and display to user
    if (EXCUSE_TYPE) {
        // if a type of excuse has already been made for the requested day, inform the user and return
        const fetchedExcuse = await ExcuseHandler.fetchExcuse(button.user.id, button.guild.id, EXCUSE_DAY, EXCUSE_TYPE);
        if (fetchedExcuse) {
            return button.reply({
                ephemeral: true,
                embeds: [new MessageEmbed({
                    color: 'GREEN',
                    title: '❗️ Woah wait-!',
                    description: '> You have already submitted a(n) `' + EXCUSE_TYPE + '` form for: `' + EXCUSE_DAY + '`!',
                    fields: [
                        {
                            name: 'Original Reason',
                            value: '> ' + fetchedExcuse.reason,
                        }
                    ],
                })],
            });
        }

        // if the request is unique, display form
        return button.showModal(new Modal({
            customId: 'EXCUSE:' + EXCUSE_DAY + ':' + EXCUSE_TYPE,
            title: EXCUSE_TYPE + ' Excuse Form for ' + EXCUSE_DAY,
            components: [
                new MessageActionRow({
                    components: [
                        new TextInputComponent({
                            customId: 'excused_reason',
                            label: 'Reason',
                            style: 'PARAGRAPH',
                            minLength: 10,
                            maxLength: 30,
                            required: true,
                        })
                    ],
                }),
            ]
        }));
    }

    // if no type, prompt user for one
    return button.reply({
        ephemeral: true,
        embeds: [new MessageEmbed({
            color: 'FUCHSIA',
            title: 'Need to be absent `' + EXCUSE_DAY + '`? Just one more thing...',
            description: '> What kind of excuse do you wish to submit?'
            + '\n\n**PLEASE NOTE YOU MAY ONLY SUBMIT ONE OF EACH PER DAY**'
            + '\n> This means for Friday you may submit the three below, for Saturday the three below, and for Sunday the three below for a total of 9 forms. Once you submit your form, you will be **UNABLE** to edit it. Thank you for your understanding ❣️',
        })],
        components: [
            new MessageActionRow({ components: await generateButtons(EXCUSE_DAY, button) })
        ],
    });
}

// generate buttons for a given day
const types = ['Absence', 'Left Early', 'Late'];
const generateButtons = async (day, button) => {
    // check and resolve each type against the day for a form already submitted
    const alreadySubmittedChecks = [];
    for (const type of types) alreadySubmittedChecks.push(
        ExcuseHandler.fetchExcuse(button.user.id, button.guild.id, day, type.toUpperCase()).then(result => result ? true : false)
    )

    // resolve and generate buttons
    const alreadySubmitted = await Promise.all(alreadySubmittedChecks);
    const buttons = [];
    for (let i = 0; i < types.length; i++) {
        buttons.push(new MessageButton({
            customId: 'EXCUSEBUTTON:' + day + ':' + types[i].toUpperCase(),
            style: alreadySubmitted[i] ? 'SECONDARY' : 'SUCCESS',
            label: types[i],
            disabled: alreadySubmitted[i]
        }));
    }
    return buttons;
}