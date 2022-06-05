module.exports = {
    name: 'interactionCreate',
    async execute( interaction ) {

        // route interactions
        try {
            if (interaction.isCommand())
                return require('./interactions/command')(interaction);
            if (interaction.isButton() && interaction.customId.startsWith('GLOBAL_'))
                return require('./interactions/button')(interaction);
            if (interaction.isButton() && interaction.customId.startsWith('EXCUSEBUTTON'))
                return require('./interactions/excuses')(interaction);
            if (interaction.isModalSubmit())
                return require('./interactions/modalSubmit')(interaction);
        }
        catch (e) {
            console.error(e);
        }
    }
}