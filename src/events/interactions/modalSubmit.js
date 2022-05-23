const { ModalSubmitInteraction, MessageEmbed } = require('discord.js');
const Excuse = require('../../util/Excused/Excuse');
const COLLECT_TIME = 5 * 60 * 1000; // 5 minutes

module.exports = async (/**@type {ModalSubmitInteraction}*/ interaction) => {
    switch (interaction.customId) {
        case 'excused_modal': {
            
            console.log(`Submitted ${interaction.customId}; received: `);
            console.log({
                TYPE: interaction.fields.getTextInputValue('excused_type'),
                DAY: interaction.fields.getTextInputValue('excused_day'),
                REASON: interaction.fields.getTextInputValue('excused_reason'),
            });

            // extract values
            const day = Excuse.parseDay(interaction.fields.getTextInputValue('excused_day'));
            const type = Excuse.parseType(interaction.fields.getTextInputValue('excused_type'));
            const reason = interaction.fields.getTextInputValue('excused_reason');

            // validate incoming data (! will change when Select Menus are supported in Discord v14)
            if (!type) {
                return interaction.reply({
                    ephemeral: true,
                    embeds: [new MessageEmbed({
                        color: 'YELLOW',
                        title: '⚠️ Hm, that doesn\'t look right...',
                        description: 'Please enter a valid type.',
                        fields: [
                            {
                                name: 'Expected',
                                value: '> ' + Excuse.types.join(' `or` '),
                            },
                            {
                                name: 'Input',
                                value: '> ' + interaction.fields.getTextInputValue('excused_type'),
                            }
                        ]
                    })]
                })
            }
            if (!day) {
                return interaction.reply({
                    ephemeral: true,
                    embeds: [new MessageEmbed({
                        color: 'YELLOW',
                        title: '⚠️ Hm, that doesn\'t look right...',
                        description: 'Please enter a valid day.',
                        fields: [
                            {
                                name: 'Expected',
                                value: '> ' + Excuse.days.join(' `or` '),
                            },
                            {
                                name: 'Input',
                                value: '> ' + interaction.fields.getTextInputValue('excused_day'),
                            }
                        ]
                    })]
                })
            }

            // post the excuse pending moderator approval
            Excuse.post(type, day, reason);

            // notify
            interaction.reply({
                ephemeral: true,
                embeds: [new MessageEmbed({
                    color: 'GREEN',
                    title: '✅ Form Submitted',
                    description: '> The administration team has been notified. Please be patient as multiple requests are processed daily ❣️',
                    fields: [
                        {
                            name: 'Form Type',
                            value: type,
                            inline: true,
                        },
                        {
                            name: 'Excused Day',
                            value: day,
                            inline: true,
                        },
                        {
                            name: 'Reason Provided',
                            value: reason,
                            inline: false,
                        }
                    ]
                })]
            });
            break;
        } // end excused_modal
    }
}