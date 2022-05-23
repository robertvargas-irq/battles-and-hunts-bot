module.exports = {
    name: 'interactionCreate',
    async execute( interaction ) {

        // route interactions
        if (interaction.isCommand())
            return require('./interactions/command')(interaction);
        if (interaction.isButton() && interaction.customId.startsWith('GLOBAL_'))
            return require('./interactions/button')(interaction);
        if (interaction.isModalSubmit())
            return require('./interactions/modalSubmit')(interaction);
    }
}