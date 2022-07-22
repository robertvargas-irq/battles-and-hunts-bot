const { Interaction } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    /** @param {Interaction} interaction */
    async execute( interaction ) {

        // route interactions
        try {
            if (interaction.isCommand())
                return require('./interactions/command')(interaction);
            if (interaction.isButton())
                return require('./interactions/button')(interaction);
            if (interaction.isModalSubmit())
                return require('./interactions/modalSubmit')(interaction);
        }
        catch (e) {
            console.error(e);
        }
    }
}