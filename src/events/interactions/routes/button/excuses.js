const ExcuseHandler = require('../../../util/Excused/ExcuseHandler');
const {
    ButtonInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    TextInputStyle,
    ModalBuilder,
    TextInputBuilder
} = require('discord.js');

const EXCUSE_MIN_LENGTH = 10;
const EXCUSE_MAX_LENGTH = 100;

/**
 * GLOBAL buttons handler
 * @param {ButtonInteraction} button Passed button interaction
 */
module.exports = async (button) => {
    if (!button.customId.startsWith('EXCUSEBUTTON')) return;
    console.log(button.customId);
    console.log(button.customId.split(':'));

    const [BUTTON_TITLE, EXCUSE_DAY, EXCUSE_TYPE] = button.customId.split(':');
    console.log({BUTTON_TITLE});
    console.log({EXCUSE_DAY});
    console.log({EXCUSE_TYPE});

    // if simply viewing, pass along
    if (BUTTON_TITLE.startsWith('EXCUSEBUTTON_VIEW')) {

        // if specific type is not provided yet, display with day options
        if (!EXCUSE_DAY) {

            // tally total excuses per day
            const userExcuseCount = {};
            for (const day of ExcuseHandler.days) {
                for (const type of ExcuseHandler.types) {
                    if (!userExcuseCount.hasOwnProperty(day)) userExcuseCount[day] = 0;
                    if (ExcuseHandler.Excuses.cache.get(button.guild.id, button.user.id, day, type))
                        userExcuseCount[day]++;
                }
            }

            return button.reply({
                ephemeral: true,
                embeds: [EmbedBuilder.from()
                    .setColor('Blurple')
                    .setTitle('📝 Status View')
                    .setDescription('Quickly view the status of any of your excuses, whether they\'ve been approved, still pending, or denied!')
                ],
                components: [new ActionRowBuilder({
                    components: ExcuseHandler.days.map(day => new ButtonBuilder({
                        customId: 'EXCUSEBUTTON_VIEW:' + day.toUpperCase(),
                        style: userExcuseCount[day] < 1 ? ButtonStyle.Secondary : ButtonStyle.Primary,
                        label: day  + ' : ' + (userExcuseCount[day] < 1 ? 'None' : userExcuseCount[day] + ' submitted'),
                        disabled: userExcuseCount[day] < 1
                    })),
                })],
            });
        }
        
        else {
    
            // generate quick viewer with expandable view
            return button.reply({
                ephemeral: true,
                embeds: [EmbedBuilder.from({
                    color: 'Fuchsia',
                    title: 'Check all of your submitted excuses for `' + EXCUSE_DAY + '`!',
                    description: '> Press any of the available buttons to pull up the original request submitted!',
                })],
                components: [
                    new ActionRowBuilder({ components: generateViewButtons(EXCUSE_DAY, button) })
                ],
            });

            // button generator for a given day
            function generateViewButtons(day, button) {
                // check each type against the day for a form already submitted
                const alreadySubmitted = [];
                for (const type of ExcuseHandler.types) alreadySubmitted.push(
                    ExcuseHandler.Excuses.cache.get(
                        button.guild.id,
                        button.user.id,
                        day,
                        type.toUpperCase()
                    )
                )
                
                const buttons = [];
                for (let i = 0; i < types.length; i++) {
                    const statusIndex = [
                        ExcuseHandler.EXCUSE_STATUSES.APPROVED,
                        ExcuseHandler.EXCUSE_STATUSES.PENDING,
                        ExcuseHandler.EXCUSE_STATUSES.DENIED,
                    ].indexOf(alreadySubmitted[i]?.status) || 0;
                    buttons.push(new ButtonBuilder({
                        customId: 'EXCUSEBUTTON:' + day + ':' + types[i].toUpperCase(),
                        style: alreadySubmitted[i] ? ButtonStyle['Success', 'Primary', 'Danger'][statusIndex] : ButtonStyle.Secondary,
                        emoji: alreadySubmitted[i] ? ['✅', '⏱', '❌'][statusIndex] : undefined,
                        label: types[i] + (
                            alreadySubmitted[i]
                            ? ' (' + alreadySubmitted[i].status + ') : Review Status'
                            : ''
                        ),
                        disabled: !alreadySubmitted[i]
                    }));
                }
                return buttons;
            }
        }
    }

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
                embeds: [EmbedBuilder.from({
                    color: ['Green', 'Yellow', 'Red'][statusIndex],
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

        // if the request is unique, display form if the day is not paused
        if (ExcuseHandler.dayIsPaused(button.guild.id, EXCUSE_DAY)) return button.reply({
            ephemeral: true,
            embeds: [EmbedBuilder.from({
                color: 'Yellow',
                title: '⚠️ Woah wait a minute-!',
                description: 'Looks like all excuse forms for **`' + EXCUSE_DAY + '`** are currently ⏸ **`PAUSED`**!'
                + '\n> The only action allowed is viewing the status of any submission you have already made.'
                + '\n\nIf you believe this is a mistake, please contact an administrator!',
                timestamp: Date.now()
            })],
            components: [new ActionRowBuilder({
                components: generateButtons(EXCUSE_DAY, button, true),
            })]
        });

        return button.showModal(ModalBuilder.from({
            customId: 'EXCUSE:' + EXCUSE_DAY + ':' + EXCUSE_TYPE,
            title: EXCUSE_TYPE + ' Excuse Form for ' + EXCUSE_DAY,
            components: [
                new ActionRowBuilder({
                    components: [
                        new TextInputBuilder({
                            customId: 'excused_reason',
                            label: 'Reason',
                            style: TextInputStyle.Paragraph,
                            minLength: EXCUSE_MIN_LENGTH,
                            maxLength: EXCUSE_MAX_LENGTH,
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
        embeds: [EmbedBuilder.from({
            color: 'Fuchsia',
            title: 'Need an excuse for `' + EXCUSE_DAY + '`? Just one more thing...',
            description: '> What kind of excuse do you wish to submit?'
            + '\n\n**PLEASE NOTE YOU MAY ONLY SUBMIT ONE OF EACH PER DAY**'
            + '\n> This means for Friday you may submit the three below, for Saturday the three below, and for Sunday the three below for a total of 9 forms. Once you submit your form, you will be **UNABLE** to edit it. Thank you for your understanding ❣️'
            + '\n\n**Want to check on the status of a form?**'
            + '\n> Any button -not- in blue is a submitted form, press it to pull up its status!',
        })],
        components: [
            new ActionRowBuilder({ components: generateButtons(EXCUSE_DAY, button) })
        ],
    });
}

// generate buttons for a given day
const types = ['Absence', 'Left Early', 'Late'];
const generateButtons = (day, button, dayPaused = false) => {
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
    
    const buttons = [];
    for (let i = 0; i < types.length; i++) {
        const statusIndex = [
            ExcuseHandler.EXCUSE_STATUSES.APPROVED,
            ExcuseHandler.EXCUSE_STATUSES.PENDING,
            ExcuseHandler.EXCUSE_STATUSES.DENIED,
        ].indexOf(alreadySubmitted[i]?.status) || 0;
        buttons.push(new ButtonBuilder({
            customId: 'EXCUSEBUTTON:' + day + ':' + types[i].toUpperCase(),
            style: alreadySubmitted[i] ? ButtonStyle['Success', 'Secondary', 'Danger'][statusIndex] : dayPaused ? ButtonStyle.Secondary : ButtonStyle.Primary,
            emoji: alreadySubmitted[i] ? ['✅', '⏱', '❌'][statusIndex] : {
                name: 'pine_spin',
                id: '962887069976379402',
                animated: true,
            },
            label: types[i] + (
                alreadySubmitted[i]
                ? ' (' + alreadySubmitted[i].status + ') : Review Status'
                : ''
            ),
            disabled: dayPaused && !alreadySubmitted[i]
        }));
    }
    return buttons;
}