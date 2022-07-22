const registerClientCommands = require('../register');

module.exports = {
    name: 'ready',
    once: 'true',
    execute(client) {
        registerClientCommands(client)
            .then(success => console.log(success))
            .catch(error => {
                console.error("Unable to parse client commands.");
                console.error("Error:", error);
                console.error("Stack:", error.stack);
            });

        client.user.setPresence({
            activities: [
                {
                    name: 'v4|Character Menus',
                    type: 'PLAYING',
                },
            ],
            status: 'online',
        });
    }
}