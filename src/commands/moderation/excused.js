const {
    BaseCommandInteraction,
    MessageActionRow,
    Modal,
    TextInputComponent,
} = require('discord.js');

module.exports = {
    name: 'excuse-form',
    description: 'Submit an excuse form for an upcoming roleplay.',
    /** @param {BaseCommandInteraction} interaction */
    async execute(interaction) {

        const modal = new Modal({
            customId: 'excused_modal',
            title: 'Excuse Form',
            components: [
                new MessageActionRow({
                    components: [
                        new TextInputComponent({
                            customId: 'excused_type',
                            label: 'Type of Excuse',
                            placeholder: 'Absence | Left Early | Late',
                            style: 'SHORT',
                            minLength: 4,
                            maxLength: 10,
                            required: true,
                        }),
                    ],
                }),
                new MessageActionRow({
                    components: [
                        new TextInputComponent({
                            customId: 'excused_day',
                            label: 'Session this applies to.',
                            placeholder: 'Friday | Saturday | Sunday',
                            style: 'SHORT',
                            minLength: 6,
                            maxLength: 8,
                            required: true,
                        }),
                    ],
                }),
                new MessageActionRow({
                    components: [
                        new TextInputComponent({
                            customId: 'excused_reason',
                            label: 'Reason',
                            style: 'PARAGRAPH',
                            minLength: 1,
                            maxLength: 25,
                            required: true,
                        })
                    ],
                }),
            ]
        });

        // show modal
        return interaction.showModal(modal);
    }
}