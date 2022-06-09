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
    if (ExcuseHandler.dayIsPaused(button.guild.id, EXCUSE_DAY)) return button.reply({
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
        const submittedExcuse = ExcuseHandler.Excuses.cache.get(button.guild.id, button.user.id, EXCUSE_DAY, EXCUSE_TYPE);
        if (submittedExcuse) {
            const statusIndex = [
                ExcuseHandler.EXCUSE_STATUSES.APPROVED,
                ExcuseHandler.EXCUSE_STATUSES.PENDING,
                ExcuseHandler.EXCUSE_STATUSES.DENIED,
            ].indexOf(submittedExcuse.status);
            return button.reply({
                ephemeral: true,
                embeds: [new MessageEmbed({
                    color: ['GREEN', 'YELLOW', 'RED'][statusIndex],
                    author: {
                        name: EXCUSE_TYPE + ' Form Status: ' + [
                            '✅ Approved',
                            '⏱ Pending',
                            '⛔️ Insufficient Excuse',
                        ][statusIndex]
                    },
                    description: 'This is the most up to date information for your excuse form. If you have any questions regarding a decision, or feel that you wish to retract this form, please contact an administrator.',
                    fields: [
                        {
                            name: 'Day',
                            value: '> `' + submittedExcuse.day + '`',
                            inline: true,
                        },
                        {
                            name: 'Type',
                            value: '> `' + submittedExcuse.type + '`',
                            inline: true,
                        },
                        {
                            name: 'Original Reason Given',
                            value: '> ' + submittedExcuse.reason,
                        },
                    ]
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
            title: 'Need an excuse for `' + EXCUSE_DAY + '`? Just one more thing...',
            description: '> What kind of excuse do you wish to submit?'
            + '\n\n**PLEASE NOTE YOU MAY ONLY SUBMIT ONE OF EACH PER DAY**'
            + '\n> This means for Friday you may submit the three below, for Saturday the three below, and for Sunday the three below for a total of 9 forms. Once you submit your form, you will be **UNABLE** to edit it. Thank you for your understanding ❣️'
            + '\n\n**Want to check on the status of a form?**'
            + '\n> Any button -not- in blue is a submitted form, press it to pull up its status!',
        })],
        components: [
            new MessageActionRow({ components: await generateButtons(EXCUSE_DAY, button) })
        ],
    });
}

// generate buttons for a given day
const types = ['Absence', 'Left Early', 'Late'];
const generateButtons = async (day, button) => {
    // check each type against the day for a form already submitted
    const alreadySubmitted = [];
    for (const type of types) alreadySubmitted.push(
        ExcuseHandler.Excuses.cache.get(
            button.guild.id,
            button.user.id,
            day,
            type.toUpperCase()
        )
    )
    
    // const alreadySubmitted = await Promise.all(alreadySubmittedChecks);
    const buttons = [];
    for (let i = 0; i < types.length; i++) {
        const statusIndex = [
            ExcuseHandler.EXCUSE_STATUSES.APPROVED,
            ExcuseHandler.EXCUSE_STATUSES.PENDING,
            ExcuseHandler.EXCUSE_STATUSES.DENIED,
        ].indexOf(alreadySubmitted[i]?.status) || 0;
        buttons.push(new MessageButton({
            customId: 'EXCUSEBUTTON:' + day + ':' + types[i].toUpperCase(),
            style: alreadySubmitted[i] ? ['SUCCESS', 'SECONDARY', 'DANGER'][statusIndex] : 'PRIMARY',
            emoji: alreadySubmitted[i] ? ['✅', '⏱', '❌'][statusIndex] : undefined,
            label: types[i] + (
                alreadySubmitted[i]
                ? ' (' + alreadySubmitted[i].status + ') : Review Status'
                : ''
            ),
        }));
    }
    return buttons;
}