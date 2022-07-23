const { Interaction, InteractionType } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    /** @param {Interaction} interaction */
    async execute( interaction ) {

        // route interactions
        try {
            if (interaction.type === InteractionType.ApplicationCommand)
                return require('./interactions/command')(interaction);
            if (interaction.type === InteractionType.ModalSubmit)
                return require('./interactions/modalSubmit')(interaction);
            if (interaction.isButton())
                return require('./interactions/button')(interaction);
        }
        catch (e) {
            console.error(e);
        }
    }
}