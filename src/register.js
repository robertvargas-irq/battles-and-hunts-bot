const Discord = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const GUILDS = ['957854680367648778'];

/**
 * Registers all slash commands from the client.
 * @param {Discord.Client} client Discord client.
 * @returns {Promise<String>}
 */
 async function registerClientCommands( client ) {

    const commands = client.commands.map( ({ execute, ...data }) => data );
    const Rest = new REST({ version: '10' }).setToken( process.env.DISCORD_TOKEN );
    const queue = [];
    
    // register command if being deployed in guilds
    for ( let g of GUILDS ) {
        queue.push(client.guilds.cache.get(g)?.commands.set(commands));
        queue.push(
            Rest.put(
                Routes.applicationGuildCommands(client.user.id, g),
                { body: commands },
            )
        );
    }

    // ensure all items in queue complete
    await Promise.all( queue );
    return Promise.resolve('Successfully reloaded all application commands.');

}

module.exports = registerClientCommands;