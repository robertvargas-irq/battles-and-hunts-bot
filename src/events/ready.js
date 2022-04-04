const registerClientCommands = require('../register');

module.exports = {
    name: 'ready',
    once: 'true',
    execute( client ) {
        registerClientCommands( client )
            .then( success => console.log( success ) )
            .catch( error => console.error("Unable to parse client commands. " + error.stack ) );

        client.user.setPresence({
            activities: [
                {
                    name: 'HUNTING UPDATE v1.0 🗡️',
                    type: 'PLAYING',
                },
            ],
            status: 'online',
        });

        let boot = client.user.tag + ' is now online!';
        console.log(`${'='.repeat( boot.length )}\n${boot}\n${'='.repeat( boot.length )}`);
    }
}