const { ModalSubmitInteraction, EmbedBuilder } = require('discord.js');
const ExcuseHandler = require('../../util/Excused/ExcuseHandler');
const Excuse = require('../../database/schemas/excuse');

module.exports = async (/**@type {ModalSubmitInteraction}*/ interaction) => {
    const [MODAL_ID, ...ARGS] = interaction.customId.split(':');
    switch (MODAL_ID) {
        case 'CHARACTERMENU': return require('./routes/modalSubmit/charactermenu')(interaction);
        case 'EXCUSE': {

            await interaction.deferReply({ ephemeral: true });
            
            console.log(`Submitted ${interaction.customId}; received: `);
            console.log({
                DAY: ARGS[0],
                TYPE: ARGS[1],
                REASON: interaction.fields.getTextInputValue('excused_reason'),
            });

            // extract values
            const [day, type] = ARGS;
            const reason = interaction.fields.getTextInputValue('excused_reason');

            // create and post the excuse, pending moderator approval
            const createdExcuse = new Excuse({
                guildId: interaction.guild.id,
                userId: interaction.user.id,
                day,
                type,
                reason,
            });
            const processingMessage = await ExcuseHandler.post(interaction, createdExcuse);
            createdExcuse.processingMessageId = processingMessage.id;
            ExcuseHandler.Excuses.cache.add(createdExcuse);
            createdExcuse.save();
            
            // notify
            interaction.editReply({
                ephemeral: true,
                embeds: [new EmbedBuilder({
                    color: 'Green',
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